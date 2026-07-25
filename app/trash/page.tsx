import Link from "next/link";

import { TrashCard } from "@/components/dashboard/trash-card";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { resumeContentSchema, TEMPLATE_LABELS, type ResumeTemplate } from "@/lib/schemas/resume";

import styles from "../dashboard.module.css";

export const dynamic = "force-dynamic";

function templateOf(content: unknown): ResumeTemplate {
  const parsed = resumeContentSchema.safeParse(content);
  return parsed.success ? parsed.data.template : "classic";
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function TrashPage() {
  const resumes = await prisma.resume.findMany({
    where: { userId: DEMO_USER_ID, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, title: true, content: true, deletedAt: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={`font-display ${styles.title}`}>Trash</h1>
          <p className={styles.subtitle}>
            Deleted resumes stay here until you restore or permanently delete them.
          </p>
        </div>
        <Link href="/" className={styles.trashLink}>
          ← Back to resumes
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className={styles.empty}>
          <h2 className="font-display" style={{ margin: 0 }}>
            Trash is empty
          </h2>
          <p className={styles.subtitle}>Deleted resumes will show up here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {resumes.map((resume) => (
            <TrashCard
              key={resume.id}
              id={resume.id}
              title={resume.title}
              templateLabel={TEMPLATE_LABELS[templateOf(resume.content)] ?? templateOf(resume.content)}
              deletedLabel={resume.deletedAt ? dateFormat.format(resume.deletedAt) : "—"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
