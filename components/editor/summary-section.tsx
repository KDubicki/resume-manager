"use client";

import { Input } from "antd";
import { Controller, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import { SectionCard } from "./section-card";

const MAX_LENGTH = 2000;

export function SummarySection() {
  const { control } = useFormContext<ResumeContent>();

  return (
    <SectionCard title="Summary">
      <Controller
        name="summary"
        control={control}
        render={({ field }) => (
          <>
            <Input.TextArea
              {...field}
              rows={4}
              maxLength={MAX_LENGTH}
              placeholder="A short pitch: who you are, what you're great at."
            />
            <div
              className="font-mono"
              style={{ fontSize: 12.5, textAlign: "right", marginTop: 4, opacity: 0.7 }}
            >
              {field.value.length} / {MAX_LENGTH}
            </div>
          </>
        )}
      />
    </SectionCard>
  );
}
