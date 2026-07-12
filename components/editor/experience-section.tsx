"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input } from "antd";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";

function CurrentAwareEndDate({ index }: { index: number }) {
  const { control } = useFormContext<ResumeContent>();
  const isCurrent = useWatch({ control, name: `experience.${index}.current` });

  return (
    <Controller
      name={`experience.${index}.endDate`}
      control={control}
      render={({ field }) => (
        <Input {...field} disabled={isCurrent} placeholder="End (blank = present)" />
      )}
    />
  );
}

export function ExperienceSection() {
  const { control } = useFormContext<ResumeContent>();
  const { fields, append, remove } = useFieldArray({ control, name: "experience" });

  return (
    <SectionCard
      title="Experience"
      meta={`${fields.length} ${fields.length === 1 ? "entry" : "entries"}`}
    >
      <div className={styles.list}>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.entry}>
            <div className={styles.row}>
              <Controller
                name={`experience.${index}.role`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input {...field} placeholder="Role" status={fieldState.error ? "error" : undefined} />
                )}
              />
              <Controller
                name={`experience.${index}.company`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="Company"
                    status={fieldState.error ? "error" : undefined}
                  />
                )}
              />
            </div>
            <div className={styles.row}>
              <Controller
                name={`experience.${index}.location`}
                control={control}
                render={({ field }) => <Input {...field} placeholder="Location" />}
              />
              <Controller
                name={`experience.${index}.startDate`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="Start (e.g. 2021-01)"
                    status={fieldState.error ? "error" : undefined}
                  />
                )}
              />
              <CurrentAwareEndDate index={index} />
            </div>
            <Controller
              name={`experience.${index}.current`}
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                  Current role
                </Checkbox>
              )}
            />
            <Controller
              name={`experience.${index}.highlights`}
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
              <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(index)}>
                Remove
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
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            company: "",
            role: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            highlights: [],
          })
        }
      >
        Add experience
      </Button>
    </SectionCard>
  );
}
