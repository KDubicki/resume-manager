import Link from "next/link";

import { ImportResumeButton } from "@/components/dashboard/import-resume-button";
import { NewResumeButton } from "@/components/dashboard/new-resume-button";
import { ResumeList } from "@/components/dashboard/resume-list";
import { computeCompleteness } from "@/lib/ats/completeness";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { resumeContentSchema, TEMPLATE_LABELS } from "@/lib/schemas/resume";

import styles from "./dashboard.module.css";

// The dashboard must always reflect the newest set of resumes (a just-created
// or just-seeded one included), so opt out of static caching.
export const dynamic = "force-dynamic";

// Parse once per resume so both the template badge and the completeness meter
// read from the same validated content (falling back to an empty resume if a
// stored blob somehow fails validation).
function parseContent(content: unknown) {
  const parsed = resumeContentSchema.safeParse(content);
  return parsed.success ? parsed.data : resumeContentSchema.parse({});
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function DashboardPage() {
  const resumes = await prisma.resume.findMany({
    where: { userId: DEMO_USER_ID, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, content: true, updatedAt: true },
  });

  const trashedCount = await prisma.resume.count({
    where: { userId: DEMO_USER_ID, deletedAt: { not: null } },
  });

  // Only the live pipeline is worth a badge — a rejection doesn't need chasing.
  const openApplications = await prisma.application.count({
    where: { userId: DEMO_USER_ID, status: { in: ["SAVED", "APPLIED", "INTERVIEW", "OFFER"] } },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={`font-display ${styles.title}`}>Your resumes</h1>
          <p className={styles.subtitle}>
            Write for a person. Export for a parser. Pick a template and build.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/applications" className={styles.trashLink}>
            Applications{openApplications > 0 ? ` (${openApplications})` : ""}
          </Link>
          {trashedCount > 0 ? (
            <Link href="/trash" className={styles.trashLink}>
              Trash ({trashedCount})
            </Link>
          ) : null}
          <ImportResumeButton />
          <NewResumeButton />
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className={styles.empty}>
          <h2 className="font-display" style={{ margin: 0 }}>
            No resumes yet
          </h2>
          <p className={styles.subtitle}>Create your first one — or import a JSON Resume file.</p>
          <div className={styles.headerActions}>
            <ImportResumeButton />
            <NewResumeButton />
          </div>
        </div>
      ) : (
        <ResumeList
          resumes={resumes.map((resume) => {
            const content = parseContent(resume.content);
            return {
              id: resume.id,
              title: resume.title,
              templateLabel: TEMPLATE_LABELS[content.template] ?? content.template,
              updatedAt: resume.updatedAt.getTime(),
              updatedLabel: dateFormat.format(resume.updatedAt),
              completeness: computeCompleteness(content).percent,
            };
          })}
        />
      )}
    </div>
  );
}
