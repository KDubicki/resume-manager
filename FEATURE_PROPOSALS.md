# Propozycje funkcjonalności — roadmapa

Lista pomysłów, które podniosłyby wartość projektu, rozbita **granularnie** na
małe, niezależnie wdrażalne zadania. Każde ma: **cel**, **dlaczego**, **gdzie**
(pliki/warstwy), **rozmiar** (S ≈ pół dnia, M ≈ 1–2 dni, L ≈ 3+ dni) i
**zależności**.

Legenda priorytetów: **P0** = szybkie, duża wartość, brak blokerów ·
**P1** = ważne, wymaga trochę pracy · **P2** = większe / zależne od innych.

> Stan wyjściowy: brak realnej autoryzacji (`DEMO_USER_ID`), pojedyncza kolumna
> JSONB `content`, dwa szablony, autozapis + eksport PDF, ATS Lens. Enum
> `Status { DRAFT, PUBLISHED }` istnieje, ale `PUBLISHED` jest nieużywany.

---

## 1. Zarządzanie CV (core)

- [x] **[CM-1] Usuwanie CV** — akcja `deleteResume(id)` + przycisk z potwierdzeniem na karcie dashboardu. ✅ zrobione
  _Dlaczego:_ dziś nie da się nic usunąć. _Gdzie:_ `lib/actions/resume.ts`, `app/page.tsx`, `components/dashboard/`. _Rozmiar:_ S.
- [x] **[CM-2] Duplikowanie CV** — „Zrób kopię" (kopiuje `content` + tytuł „… (copy)"). ✅ zrobione
  _Dlaczego:_ szybkie wariacje pod różne oferty. _Gdzie:_ `lib/actions/resume.ts`, karta dashboardu. _Rozmiar:_ S.
- [x] **[CM-3] Zmiana nazwy z dashboardu** — inline rename bez wchodzenia do edytora. ✅ zrobione
  _Gdzie:_ `components/dashboard/resume-card.tsx` + `saveTitle` (już istnieje). _Rozmiar:_ S.
- [x] **[CM-4] Soft delete + kosz** — zamiast twardego DELETE flaga `deletedAt`, widok „Trash", przywracanie. ✅ zrobione
  _Dlaczego:_ ochrona przed pomyłką. _Gdzie:_ `prisma/schema.prisma` (migracja), akcje, dashboard. _Rozmiar:_ M. _Zależy:_ CM-1.
- [x] **[CM-5] Sortowanie / wyszukiwanie na dashboardzie** — po dacie/tytule/szablonie + pole search. ✅ zrobione
  _Gdzie:_ `app/page.tsx`, `components/dashboard/resume-list.tsx`. _Rozmiar:_ S.

## 2. Wersjonowanie i niezawodność danych

- [ ] **[VR-1] Historia wersji (snapshoty)** — tabela `ResumeVersion` zapisywana przy istotnych zmianach / ręcznym „Save version".
  _Dlaczego:_ README obiecuje „draft versioning", a tego nie ma. _Gdzie:_ `prisma/schema.prisma`, `lib/actions/resume.ts`. _Rozmiar:_ L.
- [ ] **[VR-2] Podgląd i przywracanie wersji** — lista snapshotów z diffem i „Restore".
  _Gdzie:_ nowy route `app/resume/[id]/history`. _Rozmiar:_ M. _Zależy:_ VR-1.
- [ ] **[VR-3] Ochrona przed nadpisaniem (optimistic concurrency)** — pole `updatedAt`/wersja w `saveDraft`, żeby dwie karty nie kasowały sobie zmian.
  _Gdzie:_ `lib/actions/resume.ts` (`updateMany` z warunkiem wersji). _Rozmiar:_ M.
- [ ] **[VR-4] Wskaźnik „niezapisane zmiany" + ostrzeżenie przy zamknięciu** — `beforeunload`, gdy autozapis w locie.
  _Gdzie:_ `components/editor/editor-client.tsx`. _Rozmiar:_ S.

## 3. Autoryzacja i multi-user

- [ ] **[AU-1] Realne logowanie (NextAuth/Auth.js)** — zastąpienie `DEMO_USER_ID` prawdziwym `userId` z sesji.
  _Dlaczego:_ warunek dla współdzielenia, kont, bezpieczeństwa. _Gdzie:_ `lib/constants.ts`, wszystkie akcje + `app/api/export/[id]` (guard IDOR już przygotowany pod to). _Rozmiar:_ L.
- [ ] **[AU-2] Model `User` + relacja do `Resume`** — migracja, FK, indeksy.
  _Gdzie:_ `prisma/schema.prisma`. _Rozmiar:_ M. _Zależy:_ AU-1.
- [ ] **[AU-3] Rate limiting na eksporcie** — render PDF jest CPU-bound; limit per user/IP.
  _Dlaczego:_ ochrona przed nadużyciem (flagowane w CLAUDE.md jako ryzykowna powierzchnia). _Gdzie:_ `app/api/export/[id]/route.ts`. _Rozmiar:_ S.

## 4. Targetowanie pod ofertę + ATS (rozbudowa ATS Lens)

- [ ] **[ATS-1] Wklejenie opisu oferty (JD)** — pole tekstowe „Paste job description".
  _Gdzie:_ nowy panel obok ATS Lens; stan lokalny (nie musi trafiać do `content`). _Rozmiar:_ S.
- [ ] **[ATS-2] Dopasowanie słów kluczowych** — ekstrakcja keywords z JD i porównanie z treścią CV; lista „brakujących".
  _Dlaczego:_ realny sygnał ATS zamiast tylko „ile sekcji". _Gdzie:_ `components/pdf/ats-lens.tsx` + `lib/ats/` (proste NLP, bez zewnętrznego API). _Rozmiar:_ M. _Zależy:_ ATS-1.
- [ ] **[ATS-3] Wynik gotowości (ATS score 0–100)** — heurystyki: sekcje, długość, słowa kluczowe, kolumny.
  _Gdzie:_ `lib/ats/score.ts` + wizualizacja (meter). _Rozmiar:_ M. _Zależy:_ ATS-2.
- [ ] **[ATS-4] Miernik kompletności CV** — % wypełnienia (nazwa, kontakt, ≥1 experience, itd.) na karcie i w edytorze.
  _Gdzie:_ `lib/ats/completeness.ts`. _Rozmiar:_ S.
- [ ] **[ATS-5] Ostrzeżenia jakościowe** — puste sekcje, bullet bez czasownika, zbyt długie akapity, brak dat.
  _Gdzie:_ ATS Lens. _Rozmiar:_ M.

## 5. Asystent AI (Claude API)

> Wszystkie wymagają klucza `ANTHROPIC_API_KEY` i Route Handlera (Node runtime).
> Model domyślnie `claude-sonnet-5` (szybko/tanio) lub `claude-opus-4-8` dla jakości.

- [ ] **[AI-1] Przepisz bullet** — „Improve" przy pojedynczym punkcie (mocniejszy czasownik, zwięzłość, metryki).
  _Gdzie:_ `app/api/ai/rewrite/route.ts`, przycisk w `experience-section.tsx`. _Rozmiar:_ M. _Zależy:_ AU-3 (rate limit).
- [ ] **[AI-2] Wygeneruj/popraw podsumowanie** — z całości CV do sekcji Summary/About Me.
  _Gdzie:_ `summary-section.tsx`. _Rozmiar:_ M.
- [ ] **[AI-3] Dopasuj CV do oferty** — sugeruje przeredagowania i kolejność sekcji pod wklejone JD (ATS-1).
  _Gdzie:_ nowy panel; wykorzystuje ATS-1. _Rozmiar:_ L. _Zależy:_ ATS-1.
- [ ] **[AI-4] Ekstrakcja z wklejonego tekstu** — user wkleja stare CV jako tekst, AI mapuje na `resumeContentSchema` (tool use / structured output).
  _Dlaczego:_ onboarding w 30 s. _Gdzie:_ `app/api/ai/parse/route.ts`. _Rozmiar:_ L.
- [ ] **[AI-5] Generator listu motywacyjnego** — z CV + JD. _Gdzie:_ osobny dokument/route. _Rozmiar:_ M. _Zależy:_ AI-3.

## 6. Szablony i personalizacja

- [x] **[TP-1] Akcent kolorystyczny** — jedno pole `content.theme.accent`, użyte w nagłówkach/chipach obu szablonów. ✅ zrobione
  _Gdzie:_ `lib/schemas/resume.ts`, `components/pdf/templates/*`, `components/editor/appearance-section.tsx`. _Rozmiar:_ S.
- [ ] **[TP-2] Wybór czcionki** — 2–3 osadzone kroje ATS-safe (Roboto już jest; dodać np. Lato/Source Sans).
  _Gdzie:_ `components/pdf/register-fonts.ts`, szablony. _Rozmiar:_ M.
- [ ] **[TP-3] Gęstość / rozmiar tekstu** — „compact / normal / relaxed" (skala paddingów i fontSize).
  _Gdzie:_ szablony. _Rozmiar:_ S.
- [ ] **[TP-4] Widoczność sekcji (toggle)** — ukryj sekcję bez kasowania danych (`content` flaga per sekcja).
  _Gdzie:_ schema + edytor + szablony. _Rozmiar:_ M.
- [ ] **[TP-5] Kolejność sekcji w Classic** — analogicznie do Sidebara (`sidebarColumns`), lista kolejności dla Classic.
  _Gdzie:_ `lib/schemas/resume.ts`, `classic-template.tsx`, `layout-section.tsx`. _Rozmiar:_ M.
- [ ] **[TP-6] Kolejny szablon** — np. „Timeline" albo „Minimal one-page".
  _Gdzie:_ `components/pdf/templates/`, enum `templateSchema`. _Rozmiar:_ L.
- [ ] **[TP-7] Zdjęcie w Sidebarze (opcjonalne)** — upload + kadrowanie; **wyłączone** przy trybie ATS-strict.
  _Gdzie:_ storage + `sidebar-template.tsx`. _Rozmiar:_ L. _Zależy:_ AU-1.

## 7. Edytor — UX

- [ ] **[UX-1] Drag & drop kolejności wpisów** — reorder experience/education/projects (dziś brak reorderu w listach).
  _Gdzie:_ sekcje edytora (dnd-kit lub natywne). _Rozmiar:_ M.
- [ ] **[UX-2] Zwijanie/rozwijanie i „skocz do sekcji"** — nawigacja boczna po sekcjach.
  _Gdzie:_ `resume-editor.tsx`, `section-card.tsx`. _Rozmiar:_ S.
- [ ] **[UX-3] Undo/redo w formularzu** — historia stanu RHF.
  _Rozmiar:_ M.
- [ ] **[UX-4] Walidacja inline z podsumowaniem błędów** — „3 pola wymagają uwagi" + skok do pola.
  _Gdzie:_ RHF errors. _Rozmiar:_ S.
- [ ] **[UX-5] Puste stany z przykładami** — placeholdery/„Add sample" w każdej sekcji.
  _Rozmiar:_ S.

## 8. Import / eksport / udostępnianie

- [ ] **[EX-1] Publiczny link do CV** — użyj istniejącego `Status.PUBLISHED`; read-only strona `/r/[slug]`.
  _Dlaczego:_ enum już jest, feature „na wyciągnięcie ręki". _Gdzie:_ schema (slug/token), nowy route. _Rozmiar:_ M. _Zależy:_ AU-1 (właściciel), ostrożnie z prywatnością.
- [ ] **[EX-2] Eksport DOCX** — obok PDF (część ATS-ów woli .docx).
  _Gdzie:_ `app/api/export/[id]` wariant + biblioteka `docx`. _Rozmiar:_ L.
- [ ] **[EX-3] Eksport/Import JSON Resume** — zgodność ze standardem [jsonresume.org] (mapper do/z `resumeContentSchema`).
  _Dlaczego:_ przenośność danych. _Gdzie:_ `lib/interop/json-resume.ts`. _Rozmiar:_ M.
- [ ] **[EX-4] Import z pliku PDF** — parsowanie istniejącego CV → `content` (heurystyka lub AI-4).
  _Rozmiar:_ L. _Zależy:_ AI-4.
- [ ] **[EX-5] Nazwa pliku wg wzorca** — np. `Imię_Nazwisko_Firma.pdf`. _Gdzie:_ `lib/slugify.ts`, eksport. _Rozmiar:_ S.

## 9. Lokalizacja (i18n)

- [ ] **[I18N-1] Język interfejsu PL/EN** — `next-intl`/`next-i18next`; teksty do słowników.
  _Dlaczego:_ użytkownik pracuje po polsku. _Gdzie:_ globalnie. _Rozmiar:_ L.
- [ ] **[I18N-2] Język treści CV** — `content.locale`; etykiety sekcji PDF (np. „Doświadczenie" vs „Experience") i format dat.
  _Gdzie:_ schema + szablony (`SIDEBAR_SECTION_LABELS` sparametryzowane). _Rozmiar:_ M.

## 10. Jakość, testy, obserwowalność

- [ ] **[Q-1] Testy E2E (Playwright)** — ścieżki: utwórz → edytuj → autozapis → eksport; przenoszenie sekcji Sidebara.
  _Dlaczego:_ dziś tylko testy schematu. _Gdzie:_ `e2e/`. _Rozmiar:_ M.
- [ ] **[Q-2] Testy komponentów szablonów PDF** — snapshot struktury (nie pixel), regresja układu.
  _Rozmiar:_ M.
- [ ] **[Q-3] Audyt a11y w CI** — axe-core na kluczowych stronach (część już robiona ręcznie).
  _Gdzie:_ `.github/workflows/ci.yml`. _Rozmiar:_ S.
- [ ] **[Q-4] Obserwowalność eksportu** — logi czasu renderu, licznik błędów; alarm przy timeoutach.
  _Gdzie:_ `app/api/export/[id]`. _Rozmiar:_ S.
- [ ] **[Q-5] Sentry / error boundary** — łapanie błędów klienta edytora i podglądu PDF.
  _Rozmiar:_ S.

## 11. „Drobiazgi", które robią różnicę

- [ ] **[QoL-1] Skróty klawiszowe** — ⌘S = wymuś zapis, ⌘E = eksport. _Rozmiar:_ S.
- [ ] **[QoL-2] Toast po autozapisie zwięzły + czas „saved 12:04"** (część jest w `save-indicator`). _Rozmiar:_ S.
- [ ] **[QoL-3] Ostrzeżenie o przepełnieniu strony** — sygnał, gdy PDF przekracza 1/2 strony (ważne dla one-pagerów). _Rozmiar:_ M.
- [ ] **[QoL-4] Tryb podglądu pełnoekranowego PDF**. _Rozmiar:_ S.
- [ ] **[QoL-5] Data „ostatni eksport" na karcie**. _Rozmiar:_ S.

---

## Sugerowana kolejność (pierwsze 2–3 iteracje)

1. **Iteracja 1 (P0, szybkie wygrane):** CM-1, CM-2, CM-3, CM-5, EX-5, QoL-1, VR-4.
2. **Iteracja 2 (targetowanie + jakość):** ATS-1, ATS-2, ATS-4, VR-3, Q-1.
3. **Iteracja 3 (fundament pod resztę):** AU-1/AU-2 (auth) → odblokowuje EX-1 (share), AI-*, TP-7.

Auth (**AU-1**) to naturalny „kamień węgielny": po nim sensownie wchodzą
udostępnianie, konta i funkcje AI (z rate-limitingiem).

> Ten plik jest dokumentem roboczym — nie trzeba go commitować do repo
> (albo przenieść do `prd/roadmap.md`, jeśli ma zostać częścią dokumentacji).
