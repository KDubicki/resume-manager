"use client";

import { Select } from "antd";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import { SectionCard } from "./section-card";

export function SkillsSection() {
  const { control } = useFormContext<ResumeContent>();
  const skills = useWatch({ control, name: "skills" });

  return (
    <SectionCard title="Skills" meta={`${skills.length} ${skills.length === 1 ? "skill" : "skills"}`}>
      <Controller
        name="skills"
        control={control}
        render={({ field }) => (
          <Select
            mode="tags"
            aria-label="Skills"
            style={{ width: "100%" }}
            value={field.value.map((skill) => skill.name)}
            onChange={(names: string[]) =>
              field.onChange(names.map((name) => ({ id: crypto.randomUUID(), name })))
            }
            placeholder="Type a skill and press Enter"
            tokenSeparators={[","]}
          />
        )}
      />
    </SectionCard>
  );
}
