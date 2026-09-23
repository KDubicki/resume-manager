# JSON Resume import — prompt for an LLM

Turn an existing CV (PDF, DOCX, or plain text) into a file this app can
import, using any chat LLM (Claude, ChatGPT, Gemini, …).

## How to use it

1. Copy everything **below the horizontal line** into the chat.
2. Attach your CV (or paste its text) in the same message.
3. Save the reply as `resume.json`. If the chat wrapped it in a code block,
   copy only what's inside.
4. Import it:
   - **New resume:** dashboard → **Import JSON**. You pick the template in that
     dialog.
   - **Existing resume:** editor → **⋯** → **Replace content from JSON…**. This
     overwrites the resume's content but keeps its template and styling.
5. Check the import preview, then fix anything marked **`Unspecified`** in the
   editor (see [Gotchas](#gotchas)).

The field list below matches the importer in `lib/import/json-resume.ts`. Keys
not listed are ignored. If you change the importer, update this file too.

---

You are converting a CV into a **JSON Resume** document (https://jsonresume.org).

Output **only** the raw JSON object: no Markdown fences, no commentary, no text
before or after it. It must be valid JSON parseable by `JSON.parse` (double
quotes, no trailing commas, no comments). Output the whole document in one
reply; do not truncate or summarise long sections.

## Rules

- Use **only** the keys shown in the schema below. Do not add other keys.
- **Never invent facts.** If something is not in the source CV, omit the field.
  Do not guess dates, employers, titles, or metrics, and do not add numbers
  that the CV does not state.
- Keep the CV's original language; do not translate.
- **Dates:** `"YYYY"`, `"YYYY-MM"`, or `"YYYY-MM-DD"` only. Convert "03/2021"
  or "March 2021" to `"2021-03"`. If only a year is given, use `"YYYY"`.
- **Ongoing role or study:** omit `endDate` entirely. Never write "Present",
  "now", or an empty string as an `endDate`.
- **Every `work` and `education` entry needs a `startDate`.** If the CV gives
  only one date for a finished entry (e.g. "graduated 2020"), set both
  `startDate` and `endDate` to it.
- **`highlights`:** one achievement per string, a single sentence, ideally
  starting with an action verb ("Led", "Built", "Reduced"). Split paragraphs
  into separate highlights. Keep the CV's own wording where possible.
- **`work[].summary`:** omit it unless the CV has a distinct one-line scope
  statement for that role (the app turns it into the role's first bullet).
- **`skills`:** group by category, with the category in `name` and the skills
  in `keywords`. Don't list each skill as its own entry.
- **`profiles`:** include only LinkedIn. Other profiles are not imported.
- Omit these sections even if the CV has them (the app does not import them):
  `volunteer`, `awards`, `publications`, `references`, `meta`, `basics.image`,
  `basics.url`.

## Schema (every field is optional; the shape is exact)

```json
{
  "basics": {
    "name": "Full name",
    "label": "Professional headline, e.g. Senior Backend Engineer",
    "email": "name@example.com",
    "phone": "+48 555 010 123",
    "summary": "2-4 sentence professional summary.",
    "location": { "city": "Warsaw", "region": "Mazowieckie", "countryCode": "PL" },
    "profiles": [{ "network": "LinkedIn", "url": "https://www.linkedin.com/in/handle" }]
  },
  "work": [
    {
      "name": "Employer name",
      "position": "Job title",
      "location": "City, Country",
      "startDate": "2022-03",
      "endDate": "2024-08",
      "highlights": ["Achievement with a concrete result", "Another achievement"]
    }
  ],
  "education": [
    {
      "institution": "University name",
      "studyType": "B.Sc.",
      "area": "Computer Science",
      "startDate": "2016",
      "endDate": "2020",
      "score": "4.5/5.0",
      "courses": ["Distributed Systems", "Databases"]
    }
  ],
  "skills": [
    { "name": "Languages", "keywords": ["TypeScript", "Go", "Python"] },
    { "name": "Infrastructure", "keywords": ["Docker", "Kubernetes", "PostgreSQL"] }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "One sentence on what it is.",
      "highlights": ["Notable detail or result"]
    }
  ],
  "languages": [{ "language": "English", "fluency": "Professional" }],
  "certificates": [{ "name": "AWS Solutions Architect", "issuer": "Amazon", "date": "2023-06" }],
  "interests": [{ "name": "Climbing", "keywords": ["bouldering"] }]
}
```

---

## Reference: how fields land in the app

_(For you, not the LLM; you don't need to paste this part.)_

| JSON Resume                                             | Becomes                                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `basics.name` / `label` / `email` / `phone`             | Header: name, headline, contact                      |
| `basics.location`                                       | `"City, Region"` (country code if there's no region) |
| `basics.summary`                                        | Summary section                                      |
| `basics.profiles[]` whose `network` contains "LinkedIn" | LinkedIn link                                        |
| `work[]`                                                | Experience: `name` → company, `position` → role      |
| `work[].summary`                                        | Prepended as the role's **first** bullet             |
| `education[]`                                           | `studyType` → degree, `area` → field of study        |
| `education.score` / `courses[]`                         | One description line: `Score: … · Courses: …`        |
| No `endDate` (work/education)                           | Marked current, shown as "Present"                   |
| Dates                                                   | Displayed as `Mar 2024` or `2024`                    |
| `skills[].name` + `keywords[]`                          | A skill category and its skills                      |
| `skills[]` entries without `keywords`                   | Collected into one generic "Skills" group            |
| `certificates[]`                                        | One line each: `Name — Issuer (Jun 2023)`            |
| `interests[]`                                           | One line: `Climbing: bouldering; Chess`              |

## Gotchas

- **`Unspecified` placeholders.** A work entry missing its company, role, or
  `startDate` (or an education entry missing its institution, degree, or
  `startDate`) is still imported, with `Unspecified` in the gap so the import
  doesn't fail. Search the preview for it and fill it in.
- **Section headings in the PDF are English** ("Experience", "Education", …)
  whatever language the content is in. Localised headings are roadmap item
  I18N-2 in `FEATURE_PROPOSALS.md`.
- **Dropped data:** volunteering, awards, publications, references, a photo,
  a personal website, and non-LinkedIn profiles (GitHub etc.) have nowhere to
  go yet. Add them by hand if they matter (e.g. an award as a project
  highlight).
- **Want an example file?** The import dialog has a **Download a sample** link.
