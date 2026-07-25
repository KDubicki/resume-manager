"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";

import type { SaveStatus } from "@/components/app-shell/save-indicator";
import { saveDraft } from "@/lib/actions/resume";
import { resumeContentSchema, type ResumeContent } from "@/lib/schemas/resume";

import { CertificationsSection } from "./certifications-section";
import { AppearanceSection } from "./appearance-section";
import { ClassicOrderSection } from "./classic-order-section";
import { ContactSection } from "./contact-section";
import { EditorCompleteness } from "./editor-completeness";
import { EditorErrorSummary } from "./editor-error-summary";
import { EditorHistory } from "./editor-history";
import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import { InterestsSection } from "./interests-section";
import { LanguagesSection } from "./languages-section";
import { LayoutSection } from "./layout-section";
import { ProjectsSection } from "./projects-section";
import styles from "./resume-editor.module.css";
import { SectionNavProvider } from "./section-nav";
import { SectionsVisibility } from "./sections-visibility";
import { SkillsSection } from "./skills-section";
import { SummarySection } from "./summary-section";
import { useFormHistory } from "./use-form-history";

const AUTOSAVE_DELAY_MS = 4000;
const PREVIEW_DELAY_MS = 400;

export type SaveState = { status: SaveStatus; lastSavedAt: Date | null; error: string | null };
export type ResumeEditorHandle = { retry: () => Promise<boolean> };

export const ResumeEditor = forwardRef<
  ResumeEditorHandle,
  {
    resumeId: string;
    initialValues: ResumeContent;
    onSaveStateChange?: (state: SaveState) => void;
    onContentChange?: (content: ResumeContent) => void;
  }
>(function ResumeEditor({ resumeId, initialValues, onSaveStateChange, onContentChange }, ref) {
  const methods = useForm<ResumeContent>({
    // zodResolver infers the schema's *input* type (fields with .default()
    // are optional there), but every value that ever flows through this
    // form — initialValues and every useFieldArray append() — is a fully
    // populated ResumeContent. Safe to align the resolver to that type.
    resolver: zodResolver(resumeContentSchema) as Resolver<ResumeContent>,
    defaultValues: initialValues,
    mode: "onBlur",
  });
  const { watch, getValues } = methods;
  // Sidebar gets the two-column layout editor; every other (single-column)
  // template gets the linear section-order editor.
  const template = useWatch({ control: methods.control, name: "template" });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Serializes saveDraft calls so at most one is ever in flight: a second
  // caller arriving mid-save (autosave timer, blur, and retry() can all
  // fire close together) doesn't start an overlapping request that could
  // resolve out of order and let a stale write clobber a newer one in the
  // DB. Instead it flags a re-run, which always reads a *fresh* getValues()
  // once the current attempt finishes, so the last write to actually land
  // reflects whatever the form contains by then.
  const inFlightPromiseRef = useRef<Promise<boolean> | null>(null);
  const rerunRequestedRef = useRef(false);

  const runFlush = useCallback(async (): Promise<boolean> => {
    let lastOk = true;
    do {
      rerunRequestedRef.current = false;
      setSaveStatus("saving");
      try {
        const result = await saveDraft(resumeId, getValues());
        if (result.ok) {
          setSaveStatus("saved");
          setLastSavedAt(new Date(result.savedAt));
          setSaveError(null);
          lastOk = true;
        } else {
          setSaveStatus("error");
          setSaveError(result.error);
          lastOk = false;
        }
      } catch {
        // saveDraft itself catches DB-level failures, but the Server Action
        // invocation can still fail before that (e.g. a network drop), so
        // this is a second, outer safety net rather than a duplicate.
        setSaveStatus("error");
        setSaveError("a network or server error occurred");
        lastOk = false;
      }
    } while (rerunRequestedRef.current);
    return lastOk;
  }, [resumeId, getValues]);

  const flush = useCallback((): Promise<boolean> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (inFlightPromiseRef.current) {
      rerunRequestedRef.current = true;
      return inFlightPromiseRef.current;
    }
    const promise = runFlush().finally(() => {
      inFlightPromiseRef.current = null;
    });
    inFlightPromiseRef.current = promise;
    return promise;
  }, [runFlush]);

  // Ref so the live-preview timer doesn't need to be re-scheduled on every
  // parent re-render (only a new *value* should reset it).
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  // Undo/redo over the whole form (UX-3). On restore, refresh the preview
  // immediately and persist, since a reset()-driven change should behave like
  // any other edit.
  const history = useFormHistory(methods, (values) => {
    onContentChangeRef.current?.(values);
    void flush();
  });

  // Debounced (3-5s) autosave, plus a much shorter debounce driving the live
  // preview so it feels responsive without re-rendering a PDF per keystroke.
  useEffect(() => {
    const subscription = watch((values) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);

      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => {
        onContentChangeRef.current?.(values as ResumeContent);
      }, PREVIEW_DELAY_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [watch, flush]);

  useImperativeHandle(ref, () => ({ retry: () => flush() }), [flush]);

  // RHF's `watch` callback never reports type "blur" for Controller-wrapped
  // fields (it's always "change"), so blur-triggered saving needs its own
  // handler. React's synthetic focus events bubble, so one handler on the
  // whole editor catches every field's blur; relatedTarget tells us whether
  // focus actually left the form (vs. just moving to the next field), which
  // is when a save should fire immediately instead of waiting for the debounce.
  const handleBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        void flush();
      }
    },
    [flush],
  );

  // Ref so this effect only reacts to real status/lastSavedAt/error
  // transitions, not to a new inline callback identity on every parent
  // re-render.
  const onSaveStateChangeRef = useRef(onSaveStateChange);
  onSaveStateChangeRef.current = onSaveStateChange;
  useEffect(() => {
    onSaveStateChangeRef.current?.({ status: saveStatus, lastSavedAt, error: saveError });
  }, [saveStatus, lastSavedAt, saveError]);

  return (
    <FormProvider {...methods}>
      <SectionNavProvider>
        <div className={styles.stack} onBlurCapture={handleBlurCapture}>
          <EditorHistory {...history} />
          <EditorCompleteness />
          <EditorErrorSummary />
          <ContactSection />
          <AppearanceSection />
          <SectionsVisibility />
          {template === "sidebar" ? <LayoutSection /> : <ClassicOrderSection />}
          <SummarySection />
          <ExperienceSection />
          <EducationSection />
          <ProjectsSection />
          <SkillsSection />
          <LanguagesSection />
          <CertificationsSection />
          <InterestsSection />
        </div>
      </SectionNavProvider>
    </FormProvider>
  );
});
