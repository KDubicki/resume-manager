"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";

export function LanguagesSection() {
  const { control } = useFormContext<ResumeContent>();
  const { fields, append, remove } = useFieldArray({ control, name: "languages" });

  return (
    <SectionCard
      title="Languages"
      meta={`${fields.length} ${fields.length === 1 ? "language" : "languages"}`}
    >
      <div className={styles.list}>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.entry}>
            <div className={styles.row}>
              <Controller
                name={`languages.${index}.name`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="Language"
                    status={fieldState.error ? "error" : undefined}
                  />
                )}
              />
              <Controller
                name={`languages.${index}.proficiency`}
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Proficiency (e.g. Native, B2)" />
                )}
              />
            </div>
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
          </div>
        ))}
      </div>
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 16 }}
        onClick={() => append({ id: crypto.randomUUID(), name: "", proficiency: "" })}
      >
        Add language
      </Button>
    </SectionCard>
  );
}
