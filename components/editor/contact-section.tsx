"use client";

import { Input, Segmented } from "antd";
import { Controller, useFormContext } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./list-section.module.css";
import { SectionCard } from "./section-card";

const CONTACT_FIELDS = [
  { name: "contact.phone", placeholder: "Phone" },
  { name: "contact.email", placeholder: "Email" },
  { name: "contact.linkedin", placeholder: "LinkedIn URL" },
  { name: "contact.location", placeholder: "Location" },
] as const;

export function ContactSection() {
  const { control } = useFormContext<ResumeContent>();

  return (
    <SectionCard title="Header & Contact">
      <div className={styles.list}>
        {/* Template switch lives here so it's the first thing in the editor;
            it's a form field, so autosave persists it and the live preview
            re-renders in the chosen layout immediately. */}
        <Controller
          name="template"
          control={control}
          render={({ field }) => (
            <Segmented
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: "Classic (1-column, ATS-safe)", value: "classic" },
                { label: "Sidebar (2-column)", value: "sidebar" },
              ]}
            />
          )}
        />
        <div className={styles.row}>
          <Controller
            name="contact.fullName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Full name" />}
          />
          <Controller
            name="contact.headline"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Headline (e.g. Security Engineer)" />}
          />
        </div>
        <div className={styles.row}>
          {CONTACT_FIELDS.map(({ name, placeholder }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => <Input {...field} placeholder={placeholder} />}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
