"use client";

import { Input } from "antd";
import { Controller, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import { SectionCard } from "./section-card";

const MAX_LENGTH = 2000;

export function InterestsSection() {
  const { control } = useFormContext<ResumeContent>();

  return (
    <SectionCard title="Interests">
      <Controller
        name="interests"
        control={control}
        render={({ field }) => (
          <Input.TextArea
            {...field}
            rows={3}
            maxLength={MAX_LENGTH}
            placeholder="A short note on what you're into outside work (shown on the Sidebar template)."
          />
        )}
      />
    </SectionCard>
  );
}
