"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input } from "antd";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";
import { SectionEmptyState } from "./section-empty-state";
import { sampleEducation } from "./section-samples";
import { SortableEntry, SortableEntryList } from "./sortable-entry-list";

function CurrentAwareEndDate({ index }: { index: number }) {
  const { control } = useFormContext<ResumeContent>();
  const isCurrent = useWatch({ control, name: `education.${index}.current` });

  return (
    <Controller
      name={`education.${index}.endDate`}
      control={control}
      render={({ field }) => (
        <Input {...field} disabled={isCurrent} placeholder="End (blank = present)" />
      )}
    />
  );
}

export function EducationSection() {
  const { control } = useFormContext<ResumeContent>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "education" });

  return (
    <SectionCard
      title="Education"
      meta={`${fields.length} ${fields.length === 1 ? "entry" : "entries"}`}
    >
      <div className={styles.list}>
        {fields.length === 0 && (
          <SectionEmptyState
            hint="No education added yet."
            onAddSample={() => append(sampleEducation())}
          />
        )}
        <SortableEntryList ids={fields.map((field) => field.id)} onReorder={move}>
          {fields.map((field, index) => (
            <SortableEntry key={field.id} id={field.id} label={`education ${index + 1}`}>
              <div className={styles.row}>
                <Controller
                  name={`education.${index}.institution`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      placeholder="Institution"
                      status={fieldState.error ? "error" : undefined}
                    />
                  )}
                />
                <Controller
                  name={`education.${index}.degree`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      placeholder="Degree"
                      status={fieldState.error ? "error" : undefined}
                    />
                  )}
                />
                <Controller
                  name={`education.${index}.fieldOfStudy`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Field of study" />}
                />
              </div>
              <div className={styles.row}>
                <Controller
                  name={`education.${index}.startDate`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      placeholder="Start (e.g. 2015-09)"
                      status={fieldState.error ? "error" : undefined}
                    />
                  )}
                />
                <CurrentAwareEndDate index={index} />
              </div>
              <Controller
                name={`education.${index}.current`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  >
                    Currently studying here
                  </Checkbox>
                )}
              />
              <Controller
                name={`education.${index}.description`}
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    rows={2}
                    placeholder="Notable coursework, honors, thesis…"
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
          append({
            id: crypto.randomUUID(),
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          })
        }
      >
        Add education
      </Button>
    </SectionCard>
  );
}
