"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";

import type { SaveStatus } from "@/components/app-shell/save-indicator";
import { saveDraft } from "@/lib/actions/resume";
import { resumeContentSchema, type ResumeContent } from "@/lib/schemas/resume";

import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import styles from "./resume-editor.module.css";
import { SkillsSection } from "./skills-section";
import { SummarySection } from "./summary-section";

const AUTOSAVE_DELAY_MS = 4000;

export type SaveState = { status: SaveStatus; lastSavedAt: Date | null };
export type ResumeEditorHandle = { retry: () => void };

export const ResumeEditor = forwardRef<
  ResumeEditorHandle,
  {
    resumeId: string;
    initialValues: ResumeContent;
    onSaveStateChange?: (state: SaveState) => void;
  }
>(function ResumeEditor({ resumeId, initialValues, onSaveStateChange }, ref) {
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

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(
    async (values: ResumeContent) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSaveStatus("saving");
      const result = await saveDraft(resumeId, values);
      if (result.ok) {
        setSaveStatus("saved");
        setLastSavedAt(new Date(result.savedAt));
      } else {
        setSaveStatus("error");
      }
    },
    [resumeId],
  );

  // Debounced (3-5s) autosave.
  useEffect(() => {
    const subscription = watch((values) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => void flush(values as ResumeContent), AUTOSAVE_DELAY_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [watch, flush]);

  useImperativeHandle(ref, () => ({ retry: () => void flush(getValues()) }), [flush, getValues]);

  // RHF's `watch` callback never reports type "blur" for Controller-wrapped
  // fields (it's always "change"), so blur-triggered saving needs its own
  // handler. React's synthetic focus events bubble, so one handler on the
  // whole editor catches every field's blur; relatedTarget tells us whether
  // focus actually left the form (vs. just moving to the next field), which
  // is when a save should fire immediately instead of waiting for the debounce.
  const handleBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        void flush(getValues());
      }
    },
    [flush, getValues],
  );

  // Ref so this effect only reacts to real status/lastSavedAt transitions,
  // not to a new inline callback identity on every parent re-render.
  const onSaveStateChangeRef = useRef(onSaveStateChange);
  onSaveStateChangeRef.current = onSaveStateChange;
  useEffect(() => {
    onSaveStateChangeRef.current?.({ status: saveStatus, lastSavedAt });
  }, [saveStatus, lastSavedAt]);

  return (
    <FormProvider {...methods}>
      <div className={styles.stack} onBlurCapture={handleBlurCapture}>
        <SummarySection />
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
      </div>
    </FormProvider>
  );
});
