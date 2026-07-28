"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Select } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { createApplication, updateApplication } from "@/lib/actions/application";
import {
  APPLICATION_STATUS_OPTIONS,
  applicationInputSchema,
  MAX_JOB_DESCRIPTION_LENGTH,
  type ApplicationValues,
} from "@/lib/schemas/application";

import type { ApplicationItem } from "./application-filters";
import styles from "./application-form-modal.module.css";

export type ResumeOption = { value: string; label: string };

const EMPTY: ApplicationValues = {
  company: "",
  role: "",
  jobUrl: "",
  jobDescription: "",
  notes: "",
  status: "SAVED",
  resumeId: null,
};

function toValues(application: ApplicationItem | null): ApplicationValues {
  if (!application) return EMPTY;
  return {
    company: application.company,
    role: application.role,
    jobUrl: application.jobUrl,
    jobDescription: application.jobDescription,
    notes: application.notes,
    status: application.status,
    resumeId: application.resumeId,
  };
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={`font-mono ${styles.label}`}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * Create/edit dialog for a tracked application. `application === null` means
 * "create". Validation runs through the same `applicationInputSchema` the
 * Server Action re-checks, so the client can't submit a shape the server would
 * reject.
 */
export function ApplicationFormModal({
  open,
  application,
  resumes,
  onClose,
}: {
  open: boolean;
  application: ApplicationItem | null;
  resumes: ResumeOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationValues>({
    // Same cast as the resume editor: zodResolver infers the schema's *input*
    // type, but the form always holds fully-defaulted values.
    resolver: zodResolver(applicationInputSchema) as Resolver<ApplicationValues>,
    defaultValues: toValues(application),
  });

  // Reopening the dialog for a different row must not show the previous one's
  // values — reset whenever the target changes.
  useEffect(() => {
    if (open) reset(toValues(application));
  }, [open, application, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = application
        ? await updateApplication(application.id, values)
        : await createApplication(values);
      if (!result.ok) {
        message.error(result.error);
        return;
      }
      message.success(
        application ? "Application updated" : `Tracking ${values.role} at ${values.company}`,
      );
      onClose();
      router.refresh();
    } catch {
      message.error("Couldn't save that application — try again.");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal
      title={application ? "Edit application" : "Track an application"}
      open={open}
      onCancel={saving ? undefined : onClose}
      onOk={() => void onSubmit()}
      okText={application ? "Save" : "Track it"}
      confirmLoading={saving}
      width={640}
      destroyOnHidden
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <Controller
            name="company"
            control={control}
            render={({ field }) => (
              <Field label="COMPANY" error={errors.company?.message}>
                <Input {...field} placeholder="e.g. Acme Corp" status={errors.company && "error"} />
              </Field>
            )}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Field label="ROLE" error={errors.role?.message}>
                <Input
                  {...field}
                  placeholder="e.g. Security Engineer"
                  status={errors.role && "error"}
                />
              </Field>
            )}
          />
        </div>

        <div className={styles.row}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Field label="STAGE">
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={APPLICATION_STATUS_OPTIONS}
                  className={styles.fullWidth}
                />
              </Field>
            )}
          />
          <Controller
            name="resumeId"
            control={control}
            render={({ field }) => (
              <Field label="RESUME SENT" hint="Links the posting below to that resume's ATS lens.">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={field.value ?? undefined}
                  onChange={(value) => field.onChange(value ?? null)}
                  options={resumes}
                  placeholder="No resume yet"
                  className={styles.fullWidth}
                />
              </Field>
            )}
          />
        </div>

        <Controller
          name="jobUrl"
          control={control}
          render={({ field }) => (
            <Field label="POSTING LINK" error={errors.jobUrl?.message}>
              <Input
                {...field}
                placeholder="https://…"
                status={errors.jobUrl && "error"}
                inputMode="url"
              />
            </Field>
          )}
        />

        <Controller
          name="jobDescription"
          control={control}
          render={({ field }) => (
            <Field
              label="JOB DESCRIPTION"
              error={errors.jobDescription?.message}
              hint="Feeds keyword matching in the ATS lens of the linked resume."
            >
              <Input.TextArea
                {...field}
                maxLength={MAX_JOB_DESCRIPTION_LENGTH}
                autoSize={{ minRows: 4, maxRows: 10 }}
                placeholder="Paste the posting here."
              />
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Field label="NOTES" error={errors.notes?.message}>
              <Input.TextArea
                {...field}
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder="Recruiter name, referral, salary range…"
              />
            </Field>
          )}
        />
      </div>
    </Modal>
  );
}
