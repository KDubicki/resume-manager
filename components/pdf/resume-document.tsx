import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ResumeContent } from "@/lib/schemas/resume";

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
  heading: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
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
});

function formatRange(startDate: string, endDate: string, current: boolean): string {
  const endLabel = current ? "Present" : endDate || "—";
  return `${startDate} – ${endLabel}`;
}

export function ResumeDocument({ title, content }: { title: string; content: ResumeContent }) {
  return (
    <Document title={title}>
      {/* Single page, single column: layout reads top-to-bottom in one
          linear pass, so an ATS parser never has to guess reading order. */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{title}</Text>

        {content.summary.trim() ? (
          <View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.paragraph}>{content.summary}</Text>
          </View>
        ) : null}

        {content.experience.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {content.experience.map((entry) => (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {entry.role} · {entry.company}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {formatRange(entry.startDate, entry.endDate, entry.current)}
                  </Text>
                </View>
                {entry.location ? <Text style={styles.entryMeta}>{entry.location}</Text> : null}
                {entry.highlights.filter(Boolean).map((line, index) => (
                  <View key={index} style={styles.bullet}>
                    <Text style={styles.bulletDot}>{"•"}</Text>
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {content.education.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {content.education.map((entry) => (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {entry.degree}
                    {entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ""} · {entry.institution}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {formatRange(entry.startDate, entry.endDate, entry.current)}
                  </Text>
                </View>
                {entry.description ? <Text style={styles.paragraph}>{entry.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {content.skills.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.paragraph}>
              {content.skills.map((skill) => skill.name).join("   ·   ")}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
