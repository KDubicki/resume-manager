import Link from "next/link";

import { ApplicationBoard } from "@/components/applications/application-board";
import type { ApplicationItem } from "@/components/applications/application-filters";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";

import styles from "../dashboard.module.css";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function ApplicationsPage() {
  const [applications, resumes] = await Promise.all([
    prisma.application.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { updatedAt: "desc" },
      // The linked resume's title is rendered on the card and searched on, so
      // it comes back with the row instead of costing a query per card.
      include: { resume: { select: { id: true, title: true, deletedAt: true } } },
    }),
    prisma.resume.findMany({
      where: { userId: DEMO_USER_ID, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  const items: ApplicationItem[] = applications.map((application) => ({
    id: application.id,
    company: application.company,
    role: application.role,
    jobUrl: application.jobUrl,
    jobDescription: application.jobDescription,
    notes: application.notes,
    status: application.status,
    // A trashed resume is still linked in the DB, but the editor 404s on it —
    // so the card shows it as unlinked rather than offering a dead link.
    resumeId: application.resume && !application.resume.deletedAt ? application.resume.id : null,
    resumeTitle:
      application.resume && !application.resume.deletedAt ? application.resume.title : null,
    updatedAt: application.updatedAt.getTime(),
    appliedAt: application.appliedAt ? application.appliedAt.getTime() : null,
    updatedLabel: dateFormat.format(application.updatedAt),
    appliedLabel: application.appliedAt ? dateFormat.format(application.appliedAt) : null,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={`font-display ${styles.title}`}>Applications</h1>
          <p className={styles.subtitle}>
            Every role you&apos;re chasing, the resume you sent, and the posting it was targeted
            against.
          </p>
        </div>
        <Link href="/" className={styles.trashLink}>
          ← Back to resumes
        </Link>
      </div>

      <ApplicationBoard
        applications={items}
        resumes={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
      />
    </div>
  );
}
