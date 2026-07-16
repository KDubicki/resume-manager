import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Children } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import { BulletList, contactParts, displayName, formatRange, groupByCompany } from "./shared";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10.5,
    color: "#1a1a1a",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
    lineHeight: 1.4,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    // Explicit lineHeight reserves the full glyph box; without it @react-pdf
    // under-measures large/bold text and the headline below overlaps it.
    lineHeight: 1.2,
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    color: "#444444",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9.5,
    color: "#444444",
    marginBottom: 4,
  },
  // Plain-text, non-iconographic section headings — required for ATS
  // semantic clarity (README "ATS Compatibility" §3).
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 2,
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
    color: "#444444",
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
  // Categorized skills rendered as bordered chips, matching the reference CV.
  skillGroup: {
    marginBottom: 8,
  },
  skillGroupLabel: {
    fontWeight: 700,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 2,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9.5,
    fontWeight: 700,
  },
});

// Renders a section heading glued to its first content block: the heading and
// that first block share one `wrap={false}` view, so a heading can never
// strand alone at the bottom of a page while its content flows onto the next
// (which is what produced the ugly gap + page-break in Education). Remaining
// blocks flow normally so a long section still paginates.
function Section({
  title,
  accent,
  children,
}: {
  title: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children);
  if (items.length === 0) return null;
  const [firstItem, ...rest] = items;
  return (
    <View>
      <View wrap={false}>
        <Text style={[styles.sectionTitle, { color: accent, borderBottomColor: accent }]}>
          {title}
        </Text>
        {firstItem}
      </View>
      {rest}
    </View>
  );
}

export function ClassicTemplate({ title, content }: { title: string; content: ResumeContent }) {
  const { contact } = content;
  const accent = content.theme.accent;
  const parts = contactParts(contact);

  return (
    // Single column: layout reads top-to-bottom in one linear pass, so an ATS
    // parser never has to guess reading order.
    <Page size="A4" style={styles.page}>
      <Text style={styles.name}>{displayName(contact, title)}</Text>
      {contact.headline.trim() ? <Text style={styles.headline}>{contact.headline}</Text> : null}
      {parts.length > 0 ? <Text style={styles.contactLine}>{parts.join("  ·  ")}</Text> : null}

      {content.summary.trim() ? (
        <Section title="Summary" accent={accent}>
          <Text style={styles.paragraph}>{content.summary}</Text>
        </Section>
      ) : null}

      {content.experience.length > 0 ? (
        <Section title="Experience" accent={accent}>
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
      ) : null}

      {content.education.length > 0 ? (
        <Section title="Education" accent={accent}>
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
      ) : null}

      {content.projects.length > 0 ? (
        <Section title="Projects" accent={accent}>
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
      ) : null}

      {content.skillGroups.length > 0 ? (
        <Section title="Skills" accent={accent}>
          {content.skillGroups.map((group) => (
            <View key={group.id} style={styles.skillGroup} wrap={false}>
              {group.category.trim() ? (
                <Text style={[styles.skillGroupLabel, { color: accent }]}>{group.category}</Text>
              ) : null}
              <View style={styles.chipRow}>
                {group.skills.map((skill, index) => (
                  <Text key={index} style={[styles.chip, { borderColor: accent, color: accent }]}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </Section>
      ) : null}

      {content.languages.length > 0 ? (
        <Section title="Languages" accent={accent}>
          <Text style={styles.paragraph}>
            {content.languages
              .map((lang) => (lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name))
              .join("   ·   ")}
          </Text>
        </Section>
      ) : null}

      {content.certifications.length > 0 ? (
        <Section title="Certifications & Courses" accent={accent}>
          {content.certifications.map((cert) => (
            <View key={cert.id} style={styles.bullet}>
              <Text style={styles.bulletDot}>{"•"}</Text>
              <Text style={styles.bulletText}>{cert.name}</Text>
            </View>
          ))}
        </Section>
      ) : null}
    </Page>
  );
}
