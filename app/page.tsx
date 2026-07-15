import Link from "next/link";

import { NewResumeButton } from "@/components/dashboard/new-resume-button";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { resumeContentSchema } from "@/lib/schemas/resume";

import styles from "./dashboard.module.css";

// The dashboard must always reflect the newest set of resumes (a just-created
// or just-seeded one included), so opt out of static caching.
export const dynamic = "force-dynamic";

const TEMPLATE_LABEL: Record<string, string> = {
  classic: "Classic",
  sidebar: "Sidebar",
};

function templateOf(content: unknown): string {
  const parsed = resumeContentSchema.safeParse(content);
  return parsed.success ? parsed.data.template : "classic";
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
          {trashedCount > 0 ? (
            <Link href="/trash" className={styles.trashLink}>
              Trash ({trashedCount})
            </Link>
          ) : null}
          <NewResumeButton />
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className={styles.empty}>
          <h2 className="font-display" style={{ margin: 0 }}>
            No resumes yet
          </h2>
          <p className={styles.subtitle}>Create your first one to get started.</p>
          <NewResumeButton />
        </div>
      ) : (
        <div className={styles.grid}>
          {resumes.map((resume) => {
            const template = templateOf(resume.content);
            return (
              <ResumeCard
                key={resume.id}
                id={resume.id}
                title={resume.title}
                templateLabel={TEMPLATE_LABEL[template] ?? template}
                updatedLabel={dateFormat.format(resume.updatedAt)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
