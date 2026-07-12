"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type Resolver } from "react-hook-form";

import { resumeContentSchema, type ResumeContent } from "@/lib/schemas/resume";

import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import styles from "./resume-editor.module.css";
import { SkillsSection } from "./skills-section";
import { SummarySection } from "./summary-section";

export function ResumeEditor({ initialValues }: { initialValues: ResumeContent }) {
  const methods = useForm<ResumeContent>({
    // zodResolver infers the schema's *input* type (fields with .default()
    // are optional there), but every value that ever flows through this
    // form — initialValues and every useFieldArray append() — is a fully
    // populated ResumeContent. Safe to align the resolver to that type.
    resolver: zodResolver(resumeContentSchema) as Resolver<ResumeContent>,
    defaultValues: initialValues,
    mode: "onBlur",
  });

  return (
    <FormProvider {...methods}>
      <div className={styles.stack}>
        <SummarySection />
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
      </div>
    </FormProvider>
  );
}
