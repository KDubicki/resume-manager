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
  groupByCompany,
  scaleStyleSheet,
  skillGroupNodes,
} from "./shared";

// Modern: single-column and ATS-safe (real text, one linear top-to-bottom
// reading pass), but with a filled accent header band and accent-bar section
// titles that read very differently from Classic's plain black-on-white. It
// shares Classic's section set and ordering (classicOrder), so the reorder
// editor and full ATS reading-order credit come for free.
const baseStyles = StyleSheet.create({
  page: {
    fontSize: 10.5,
    color: "#1f1f1f",
    // No top/side page padding so the header band spans edge-to-edge; the body
    // wrapper below re-adds horizontal padding for the content.
    paddingBottom: 40,
    lineHeight: 1.4,
  },
  // Rendered once at the very top. On a page break the body simply continues
  // below, so we never depend on the band repeating on later pages.
  header: {
    // backgroundColor is set to the accent at render time.
    paddingTop: 36,
    paddingBottom: 26,
    paddingHorizontal: 44,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
    // Explicit lineHeight reserves the full glyph box; without it @react-pdf
    // under-measures large/bold text and the headline below overlaps it.
    lineHeight: 1.2,
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    color: "#eef2ff",
    marginBottom: 10,
  },
  contactLine: {
    fontSize: 9.5,
    color: "#eef2ff",
  },
  body: {
    paddingHorizontal: 44,
    paddingTop: 18,
  },
  // Section title is an accent bar + accent uppercase label. Spacing lives on
  // titleRow so the label itself carries only typography.
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 6,
  },
  titleBar: {
    width: 18,
    height: 3,
    marginRight: 8,
    borderRadius: 1,
  },
  // Plain-text, non-iconographic section heading — required for ATS semantic
  // clarity (README "ATS Compatibility" §3).
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  paragraph: {
    marginBottom: 8,
  },
  entry: {
    marginBottom: 10,
  },
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  companyName: {
    fontWeight: 700,
    fontSize: 11.5,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontWeight: 700,
  },
  entryMeta: {
    fontStyle: "italic",
    color: "#555555",
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
  // Skills presentation (chips / pills / inline) is chosen by theme.skillsStyle
  // and rendered by skillGroupNodes; these are the base styles it composes with.
  skillGroup: {
    marginBottom: 8,
  },
  skillGroupLabel: {
    fontWeight: 700,
    marginBottom: 5,
  },
  skillInline: {
    marginBottom: 4,
  },
  skillInlineLabel: {
    fontWeight: 700,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9.5,
    fontWeight: 600,
    // Tight lineHeight + centered text so the label sits centered in the chip
    // rather than riding high (chips otherwise inherit the page's 1.4 leading).
    lineHeight: 1,
    textAlign: "center",
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
        <View style={styles.titleRow}>
          <View style={[styles.titleBar, { backgroundColor: accent }]} />
          <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
        </View>
        {firstItem}
      </View>
      {rest}
    </View>
  );
}

export function ModernTemplate({ title, content }: { title: string; content: ResumeContent }) {
  const { contact } = content;
  const accent = content.theme.accent;
  const fontFamily = content.theme.fontFamily;
  const styles = scaleStyleSheet(baseStyles, content.theme.density, {
    margin: content.theme.sectionSpacing,
    padding: content.theme.pageMargin,
  });
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
        {groupByCompany(content.experience).map((group, groupIndex) => {
          const first = group.entries[0]!;
          const last = group.entries[group.entries.length - 1]!;
          return (
            <View key={groupIndex} style={styles.entry}>
              <View style={styles.companyRow}>
                <Text style={styles.companyName}>{group.company}</Text>
                <Text style={styles.entryMeta}>
                  {formatRange(last.startDate, first.endDate, first.current)}
                </Text>
              </View>
              {group.entries.map((entry) => (
                <View key={entry.id} style={{ marginTop: 4 }} wrap={false}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryTitle}>{entry.role}</Text>
                    <Text style={styles.entryMeta}>
                      {formatRange(entry.startDate, entry.endDate, entry.current)}
                    </Text>
                  </View>
                  {entry.location ? <Text style={styles.entryMeta}>{entry.location}</Text> : null}
                  <BulletList items={entry.highlights} styles={styles} />
                </View>
              ))}
            </View>
          );
        })}
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
            <Text style={styles.entryTitle}>
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
        {skillGroupNodes(content.skillGroups, content.theme.skillsStyle, accent, styles)}
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
      <View style={[styles.header, { backgroundColor: accent }]}>
        <Text style={styles.name}>{displayName(contact, title)}</Text>
        {contact.headline.trim() ? <Text style={styles.headline}>{contact.headline}</Text> : null}
        {parts.length > 0 ? <Text style={styles.contactLine}>{parts.join("  ·  ")}</Text> : null}
      </View>

      <View style={styles.body}>
        {order.map((key) =>
          hidden.has(key) ? null : <Fragment key={key}>{sectionNodes[key]}</Fragment>,
        )}
      </View>
    </Page>
  );
}
