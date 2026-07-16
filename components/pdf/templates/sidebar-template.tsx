import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import {
  normalizeSidebarColumns,
  SIDEBAR_SECTION_LABELS,
  type ResumeContent,
  type SidebarSectionKey,
} from "@/lib/schemas/resume";

import { BulletList, displayName, formatRange, scaleStyleSheet } from "./shared";

const INK = "#333333";
const MUTED = "#555555";
const RULE = "#bbbbbb";

const baseStyles = StyleSheet.create({
  page: {
    fontSize: 9.5,
    color: INK,
    paddingTop: 34,
    paddingBottom: 40,
    paddingHorizontal: 36,
    lineHeight: 1.4,
  },
  name: {
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 4,
    textTransform: "uppercase",
    // letterSpacing makes @react-pdf under-measure the line box, so the
    // headline overlaps the name without an explicit lineHeight + margin.
    lineHeight: 1.25,
    marginBottom: 8,
  },
  headline: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
    lineHeight: 1.3,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: INK,
    marginTop: 12,
    marginBottom: 12,
  },
  columns: {
    flexDirection: "row",
  },
  // Fixed-width left rail; the main column flexes to fill the rest. Each
  // column reads top-to-bottom on its own — the ATS Lens still flags the
  // two-column layout, since a parser can interleave the two rails.
  sidebar: {
    width: "34%",
    paddingRight: 16,
  },
  main: {
    flex: 1,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#e5e5e5",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitleFirst: {
    marginTop: 0,
  },
  contactLabel: {
    fontWeight: 700,
  },
  contactValue: {
    marginBottom: 3,
    color: MUTED,
  },
  block: {
    marginBottom: 8,
  },
  blockDates: {
    fontWeight: 700,
  },
  blockTitle: {
    fontStyle: "italic",
    color: MUTED,
    marginBottom: 3,
  },
  paragraph: {
    marginBottom: 6,
    color: MUTED,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 9,
  },
  bulletText: {
    flex: 1,
    color: MUTED,
  },
  skillGroup: {
    marginBottom: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginVertical: 8,
  },
});

function SidebarSectionTitle({
  children,
  accent,
  styles,
  first,
}: {
  children: string;
  accent: string;
  styles: typeof baseStyles;
  first?: boolean;
}) {
  return (
    <Text
      style={[styles.sectionTitle, { color: accent }, ...(first ? [styles.sectionTitleFirst] : [])]}
    >
      {children}
    </Text>
  );
}

export function SidebarTemplate({ title, content }: { title: string; content: ResumeContent }) {
  const { contact } = content;
  const accent = content.theme.accent;
  const fontFamily = content.theme.fontFamily;
  const styles = scaleStyleSheet(baseStyles, content.theme.density);
  const contactRows: { label: string; value: string }[] = [
    { label: "Phone: ", value: contact.phone },
    { label: "E-mail: ", value: contact.email },
    { label: "LinkedIn: ", value: contact.linkedin },
    { label: "Location: ", value: contact.location },
  ].filter((row) => row.value.trim().length > 0);

  // Each section's body (title excluded) or null when it has no content. The
  // column arrays below decide where each one goes and in what order, so the
  // same section renders identically in either column — moving it is purely a
  // matter of which list it appears in.
  const bodies: Record<SidebarSectionKey, ReactNode> = {
    contact:
      contactRows.length > 0
        ? contactRows.map((row) => (
            <Text key={row.label} style={styles.contactValue}>
              <Text style={styles.contactLabel}>{row.label}</Text>
              {row.value}
            </Text>
          ))
        : null,
    summary: content.summary.trim() ? (
      <Text style={styles.paragraph}>{content.summary}</Text>
    ) : null,
    experience:
      content.experience.length > 0
        ? content.experience.map((entry) => (
            <View key={entry.id} style={styles.block} wrap={false}>
              <Text style={styles.blockDates}>
                {formatRange(entry.startDate, entry.endDate, entry.current)}
              </Text>
              <Text style={styles.blockTitle}>
                {entry.role}
                {entry.company ? ` at ${entry.company}` : ""}
              </Text>
              <BulletList items={entry.highlights} styles={styles} />
            </View>
          ))
        : null,
    education:
      content.education.length > 0
        ? content.education.map((entry) => (
            <View key={entry.id} style={styles.block}>
              <Text style={styles.blockDates}>
                {formatRange(entry.startDate, entry.endDate, entry.current)}
              </Text>
              <Text style={styles.paragraph}>
                {entry.institution}
                {entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ""}
                {entry.degree ? `, ${entry.degree}` : ""}
              </Text>
            </View>
          ))
        : null,
    skills:
      content.skillGroups.length > 0
        ? content.skillGroups.map((group) => (
            <View key={group.id} style={styles.skillGroup}>
              <Text style={styles.paragraph}>
                {group.category.trim() ? (
                  <Text style={styles.contactLabel}>{group.category}: </Text>
                ) : null}
                {group.skills.join(", ")}
              </Text>
            </View>
          ))
        : null,
    projects:
      content.projects.length > 0
        ? content.projects.map((project) => (
            <View key={project.id} style={styles.block} wrap={false}>
              <Text style={styles.blockDates}>{project.name}</Text>
              {project.description ? (
                <Text style={styles.paragraph}>{project.description}</Text>
              ) : null}
              <BulletList items={project.highlights} styles={styles} />
            </View>
          ))
        : null,
    languages: content.languages.length > 0 ? (
      <Text style={styles.paragraph}>
        {content.languages
          .map((lang) => (lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name))
          .join(", ")}
      </Text>
    ) : null,
    certifications:
      content.certifications.length > 0
        ? content.certifications.map((cert) => (
            <View key={cert.id} style={styles.bullet}>
              <Text style={styles.bulletDot}>{"•"}</Text>
              <Text style={styles.bulletText}>{cert.name}</Text>
            </View>
          ))
        : null,
    interests: content.interests.trim() ? (
      <Text style={styles.paragraph}>{content.interests}</Text>
    ) : null,
  };

  const columns = normalizeSidebarColumns(content.sidebarColumns);

  function renderColumn(keys: SidebarSectionKey[]) {
    // Drop empty sections first so the "first" (no top margin) styling lands on
    // whichever section actually renders at the top of the column.
    const present = keys.filter((key) => bodies[key] != null);
    return present.map((key, index) => (
      <View key={key}>
        <SidebarSectionTitle accent={accent} styles={styles} first={index === 0}>
          {SIDEBAR_SECTION_LABELS[key]}
        </SidebarSectionTitle>
        {bodies[key]}
      </View>
    ));
  }

  return (
    <Page size="A4" style={[styles.page, { fontFamily }]}>
      <Text style={styles.name}>{displayName(contact, title)}</Text>
      {contact.headline.trim() ? <Text style={styles.headline}>{contact.headline}</Text> : null}
      <View style={[styles.headerRule, { borderBottomColor: accent }]} />

      <View style={styles.columns}>
        <View style={styles.sidebar}>{renderColumn(columns.left)}</View>
        <View style={styles.main}>{renderColumn(columns.right)}</View>
      </View>
    </Page>
  );
}
