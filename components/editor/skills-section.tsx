"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";
import { SectionEmptyState } from "./section-empty-state";
import { sampleSkillGroup } from "./section-samples";

export function SkillsSection() {
  const { control } = useFormContext<ResumeContent>();
  const { fields, append, remove } = useFieldArray({ control, name: "skillGroups" });

  return (
    <SectionCard
      title="Skills"
      meta={`${fields.length} ${fields.length === 1 ? "group" : "groups"}`}
    >
      <div className={styles.list}>
        {fields.length === 0 && (
          <SectionEmptyState
            hint="No skill groups added yet."
            onAddSample={() => append(sampleSkillGroup())}
          />
        )}
        {fields.map((field, index) => (
          <div key={field.id} className={styles.entry}>
            <Controller
              name={`skillGroups.${index}.category`}
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Category (e.g. Programming, Networking)" />
              )}
            />
            <Controller
              name={`skillGroups.${index}.skills`}
              control={control}
              render={({ field }) => (
                <Select
                  mode="tags"
                  aria-label="Skills in this group"
                  style={{ width: "100%" }}
                  value={field.value}
                  onChange={(items: string[]) => field.onChange(items)}
                  placeholder="Type a skill and press Enter"
                  tokenSeparators={[","]}
                />
              )}
            />
            <div className={styles.entryFooter}>
              <Button
                type="text"
                className={styles.removeButton}
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
              >
                Remove group
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 16 }}
        onClick={() => append({ id: crypto.randomUUID(), category: "", skills: [] })}
      >
        Add skill group
      </Button>
    </SectionCard>
  );
}
