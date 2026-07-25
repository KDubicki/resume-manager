import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Children, Fragment, type ReactNode } from "react";

import {
  normalizeClassicOrder,
  type ClassicSectionKey,
  type ResumeContent,
} from "@/lib/schemas/resume";

import {
  BulletList,
  contactParts,
  displayName,
  formatRange,
  scaleStyleSheet,
} from "./shared";

// Minimal: single-column and ATS-safe like Classic, but stripped back — no
// header band, no rules on section titles, no skill chips. Restraint and
// whitespace carry the design; the accent shows up only in the small-caps
// section labels. Shares Classic's section set and ordering (classicOrder), so
// the reorder editor and full ATS reading-order credit come for free. Unlike
// Classic/Modern it lists each role as its own entry (no company grouping),
// which suits the airier layout.
const INK = "#222222";
const MUTED = "#666666";

const baseStyles = StyleSheet.create({
  page: {
    fontSize: 10.5,
    color: INK,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 23,
    fontWeight: 400,
    letterSpacing: 1,
    lineHeight: 1.2,
    marginBottom: 3,
  },
  headline: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },
  contactLine: {
    fontSize: 9.5,
    color: MUTED,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
    marginTop: 14,
  },
  // Plain-text, non-iconographic section heading — required for ATS semantic
  // clarity (README "ATS Compatibility" §3). No rule, wide tracking, small.
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    marginTop: 22,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 8,
    color: "#333333",
  },
  entry: {
    marginBottom: 12,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontWeight: 700,
  },
  entryMeta: {
    color: MUTED,
  },
  entrySub: {
    color: MUTED,
    marginBottom: 2,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  skillGroup: {
    marginBottom: 5,
  },
  skillLabel: {
    fontWeight: 700,
  },
});

// Glues a section heading to its first content block (shared wrap={false} view)
// so a heading can never strand alone at the bottom of a page; the rest flows
// normally so a long section still paginates. Mirrors the Classic template.
function Section({
  title,
  accent,
  styles,
  children,
}: {
  title: React.ReactNode;
  accent: string;
  styles: typeof baseStyles;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children);
  if (items.length === 0) return null;
  const [firstItem, ...rest] = items;
  return (
    <View>
      <View wrap={false}>
        <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
        {firstItem}
      </View>
      {rest}
    </View>
  );
}

export function MinimalTemplate({ title, content }: { title: string; content: ResumeContent }) {
  const { contact } = content;
  const accent = content.theme.accent;
  const fontFamily = content.theme.fontFamily;
  const styles = scaleStyleSheet(baseStyles, content.theme.density);
  const hidden = new Set(content.hiddenSections);
  const parts = contactParts(contact);

  const sectionNodes: Record<ClassicSectionKey, ReactNode> = {
    summary: content.summary.trim() ? (
      <Section title="Summary" accent={accent} styles={styles}>
        <Text style={styles.paragraph}>{content.summary}</Text>
      </Section>
    ) : null,
    experience: content.experience.length > 0 ? (
      <Section title="Experience" accent={accent} styles={styles}>
        {content.experience.map((entry) => (
          <View key={entry.id} style={styles.entry} wrap={false}>
            <View style={styles.entryHeaderRow}>
              <Text style={styles.entryTitle}>
                {entry.role}
                {entry.company ? ` · ${entry.company}` : ""}
              </Text>
              <Text style={styles.entryMeta}>
                {formatRange(entry.startDate, entry.endDate, entry.current)}
              </Text>
            </View>
            {entry.location ? <Text style={styles.entrySub}>{entry.location}</Text> : null}
            <BulletList items={entry.highlights} styles={styles} />
          </View>
        ))}
      </Section>
    ) : null,
    education: content.education.length > 0 ? (
      <Section title="Education" accent={accent} styles={styles}>
        {content.education.map((entry) => (
          <View key={entry.id} style={styles.entry} wrap={false}>
            <View style={styles.entryHeaderRow}>
              <Text style={styles.entryTitle}>{entry.institution}</Text>
              <Text style={styles.entryMeta}>
                {formatRange(entry.startDate, entry.endDate, entry.current)}
              </Text>
            </View>
            <Text style={styles.entrySub}>
              {entry.degree}
              {entry.fieldOfStudy ? ` · ${entry.fieldOfStudy}` : ""}
            </Text>
            {entry.description ? <Text style={styles.paragraph}>{entry.description}</Text> : null}
          </View>
        ))}
      </Section>
    ) : null,
    projects: content.projects.length > 0 ? (
      <Section title="Projects" accent={accent} styles={styles}>
        {content.projects.map((project) => (
          <View key={project.id} style={styles.entry} wrap={false}>
            <Text style={styles.entryTitle}>{project.name}</Text>
            {project.description ? (
              <Text style={{ marginBottom: 2 }}>{project.description}</Text>
            ) : null}
            <BulletList items={project.highlights} styles={styles} />
          </View>
        ))}
      </Section>
    ) : null,
    skills: content.skillGroups.length > 0 ? (
      <Section title="Skills" accent={accent} styles={styles}>
        {content.skillGroups.map((group) => (
          <View key={group.id} style={styles.skillGroup}>
            <Text style={styles.paragraph}>
              {group.category.trim() ? (
                <Text style={styles.skillLabel}>{group.category}: </Text>
              ) : null}
              {group.skills.join(", ")}
            </Text>
          </View>
        ))}
      </Section>
    ) : null,
    languages: content.languages.length > 0 ? (
      <Section title="Languages" accent={accent} styles={styles}>
        <Text style={styles.paragraph}>
          {content.languages
            .map((lang) => (lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name))
            .join("   ·   ")}
        </Text>
      </Section>
    ) : null,
    certifications: content.certifications.length > 0 ? (
      <Section title="Certifications & Courses" accent={accent} styles={styles}>
        {content.certifications.map((cert) => (
          <View key={cert.id} style={styles.bullet}>
            <Text style={styles.bulletDot}>{"•"}</Text>
            <Text style={styles.bulletText}>{cert.name}</Text>
          </View>
        ))}
      </Section>
    ) : null,
  };

  const order = normalizeClassicOrder(content.classicOrder);

  return (
    // Single column: layout reads top-to-bottom in one linear pass, so an ATS
    // parser never has to guess reading order.
    <Page size="A4" style={[styles.page, { fontFamily }]}>
      <Text style={styles.name}>{displayName(contact, title)}</Text>
      {contact.headline.trim() ? <Text style={styles.headline}>{contact.headline}</Text> : null}
      {parts.length > 0 ? <Text style={styles.contactLine}>{parts.join("   ·   ")}</Text> : null}
      <View style={styles.headerRule} />

      {order.map((key) =>
        hidden.has(key) ? null : <Fragment key={key}>{sectionNodes[key]}</Fragment>,
      )}
    </Page>
  );
}
