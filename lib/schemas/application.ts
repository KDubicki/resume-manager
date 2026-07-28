import { z } from "zod";

// Mirrors the `ApplicationStatus` enum in prisma/schema.prisma. Kept as a
// const tuple so the labels/options below are exhaustive by construction — add
// a stage here and TypeScript forces you to label it.
export const APPLICATION_STATUSES = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: APPLICATION_STATUS_LABELS[status],
}));

// Statuses that mean "this was actually sent". Reaching any of them stamps
// `appliedAt` (once), so the list can show how long a submission has been
// outstanding regardless of later edits.
const SENT_STATUSES = new Set<ApplicationStatus>(["APPLIED", "INTERVIEW", "OFFER"]);

export function isSentStatus(status: ApplicationStatus): boolean {
  return SENT_STATUSES.has(status);
}

// Same ceiling the job-description panel used when this text was browser-only:
// real postings (responsibilities + requirements + boilerplate) run long.
export const MAX_JOB_DESCRIPTION_LENGTH = 20000;

const MAX_NOTES_LENGTH = 4000;

// One schema, both sides — the modal validates with it via the RHF resolver and
// the Server Action re-validates the same payload before it reaches Postgres,
// exactly like `resumeContentSchema` does for the JSONB blob.
export const applicationInputSchema = z.object({
  company: z.string().trim().min(1, { error: "Company is required" }),
  role: z.string().trim().min(1, { error: "Role is required" }),
  jobUrl: z
    .string()
    .trim()
    .default("")
    // Blank is fine (not every posting has a durable link), but a non-blank
    // value must be a real absolute URL — the card renders it as an anchor.
    .refine((url) => url === "" || /^https?:\/\/\S+$/i.test(url), {
      error: "Link must start with http:// or https://",
    }),
  jobDescription: z
    .string()
    .max(MAX_JOB_DESCRIPTION_LENGTH, { error: "That job description is too long to store" })
    .default(""),
  notes: z.string().max(MAX_NOTES_LENGTH, { error: "Notes are too long" }).default(""),
  status: applicationStatusSchema.default("SAVED"),
  // The linked resume is optional: you can track a role before deciding which
  // resume to send. Empty string (antd's "cleared" Select value) and undefined
  // both normalize to null so the column stays clean.
  resumeId: z
    .string()
    .nullish()
    .transform((value) => (value && value.trim() ? value.trim() : null)),
});

export type ApplicationInput = z.input<typeof applicationInputSchema>;
export type ApplicationValues = z.output<typeof applicationInputSchema>;
