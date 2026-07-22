"use client";

import { Select } from "antd";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import { SectionCard } from "./section-card";
import { SectionEmptyState } from "./section-empty-state";
import { sampleCertifications } from "./section-samples";

export function CertificationsSection() {
  const { control, setValue } = useFormContext<ResumeContent>();
  const certifications = useWatch({ control, name: "certifications" });

  return (
    <SectionCard
      title="Certifications & Courses"
      meta={`${certifications.length} ${certifications.length === 1 ? "item" : "items"}`}
    >
      <Controller
        name="certifications"
        control={control}
        render={({ field }) => (
          <Select
            mode="tags"
            aria-label="Certifications and courses"
            style={{ width: "100%" }}
            value={field.value.map((cert) => cert.name)}
            onChange={(names: string[]) =>
              field.onChange(names.map((name) => ({ id: crypto.randomUUID(), name })))
            }
            placeholder="Type a certification and press Enter"
          />
        )}
      />
      {certifications.length === 0 && (
        <div style={{ marginTop: 12 }}>
          <SectionEmptyState
            hint="No certifications or courses added yet."
            onAddSample={() =>
              setValue("certifications", sampleCertifications(), {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          />
        </div>
      )}
    </SectionCard>
  );
}
