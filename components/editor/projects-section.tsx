"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";
import { SectionEmptyState } from "./section-empty-state";
import { sampleProject } from "./section-samples";
import { SortableEntry, SortableEntryList } from "./sortable-entry-list";

export function ProjectsSection() {
  const { control } = useFormContext<ResumeContent>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "projects" });

  return (
    <SectionCard
      title="Projects"
      meta={`${fields.length} ${fields.length === 1 ? "project" : "projects"}`}
    >
      <div className={styles.list}>
        {fields.length === 0 && (
          <SectionEmptyState
            hint="No projects added yet."
            onAddSample={() => append(sampleProject())}
          />
        )}
        <SortableEntryList ids={fields.map((field) => field.id)} onReorder={move}>
          {fields.map((field, index) => (
            <SortableEntry key={field.id} id={field.id} label={`project ${index + 1}`}>
              <Controller
                name={`projects.${index}.name`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="Project name"
                    status={fieldState.error ? "error" : undefined}
                  />
                )}
              />
              <Controller
                name={`projects.${index}.description`}
                control={control}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={2} placeholder="Short description" />
                )}
              />
              <Controller
                name={`projects.${index}.highlights`}
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    value={field.value.join("\n")}
                    onChange={(e) => field.onChange(e.target.value.split("\n"))}
                    rows={3}
                    placeholder="One highlight per line"
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
                  Remove
                </Button>
              </div>
            </SortableEntry>
          ))}
        </SortableEntryList>
      </div>
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 16 }}
        onClick={() =>
          append({ id: crypto.randomUUID(), name: "", description: "", highlights: [] })
        }
      >
        Add project
      </Button>
    </SectionCard>
  );
}
