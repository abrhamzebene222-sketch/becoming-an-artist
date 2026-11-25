You are writing lesson content for "Becoming an Artist", a bilingual (English + Amharic) art-school app.
The curriculum tree already exists. Fill exactly these lesson slots and nothing else.

You are writing {{N}} lesson(s): {{LIST}}

| slot | chapter | unit path | course | lesson # | title | course slug |
|---|---|---|---|---|---|---|
{{SLOTS}}

## Output rules — follow exactly

1. One JavaScript file per slot. No prose between files, no markdown headings in the output.
2. File name: `<slot>-<kebab-case-title>.js` (e.g. `L014-the-four-step-critique.js`).
3. Each file is exactly this shape:

```js
export default {
  slot: 'L014',
  course: 'the-course-slug-from-the-table-above',
  title: 'the title from the table, verbatim',
  titleAm: 'the Amharic title from the manifest, verbatim',
  creditHours: 1.5,
  blocks: [
    { type: 'heading', text: 'What critique is for', textAm: 'ግምገማ ለምን እንደሚያገለግል' },
    { type: 'text', text: 'English body…', textAm: 'የአማርኛ ጽሑፍ…' },
    { type: 'step', text: 'First step…', textAm: 'የመጀመሪያ ደረጃ…' },
    { type: 'callout', variant: 'tip', text: 'A studio tip…', textAm: 'የስቱዲዮ ምክር…' },
    { type: 'image', imageUrl: 'https://res.cloudinary.com/…', publicId: 'blocks/…', caption: 'Plate 3' },
    { type: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=…', caption: 'Demonstration' },
    { type: 'imageHint', text: 'Close-up of a hand holding a pencil in an overhand grip, side view, plain background', textAm: 'እርሳስን በላይኛው መያዣ የያዘ እጅ ቅርብ ምስል፣ ከጎን፣ ንጹህ ጀርባ' },
  ],
};
```

## Credit hours — required in every file

`creditHours` is the size of the lesson. The school multiplies it by its price per credit hour to get the lesson's price,
so it must honestly match how long the lesson takes a student to read AND do.

| lesson kind | typical `creditHours` |
|---|---|
| theory only (history, concepts, critique, reading) | 0.5 – 1 |
| mixed (short explanation + a drawing/painting exercise) | 1 – 2 |
| practical / studio (a full exercise, a finished study, many steps) | 1.5 – 3 |

- A plain number such as `1`, `1.5` or `0.75` (max two decimals, between 0.1 and 10). Not a string.
- The more `step` blocks and the longer the practice the student must do, the higher the number. A pure-reading lesson with no `step` blocks stays at 1 or below.
- Never copy the same number into every file — judge each lesson on its own.

## The seven block types — no others exist

| type | required | rules |
|---|---|---|
| `heading` | `text` | short section title, max 300 characters. Resets step numbering to 1. |
| `text` | `text` | body paragraph, max 20 000 characters. |
| `step` | `text` | one numbered procedure step. Numbering is automatic — never write "Step 1" yourself. Restarts after a `heading`. |
| `callout` | `text`, `variant` | `variant: 'tip'` or `'warning'`. Max 5 000 characters. |
| `image` | `imageUrl` | also give `publicId` when you know it; `caption` optional. |
| `youtube` | `youtubeUrl` | a real youtube.com / youtu.be link; the server extracts the 11-character id. |
| `imageHint` | `text`, `textAm` | an "add image here" slot for the admin: describe the picture to add (subject, view, composition, style), max 1 000 characters. Shown only to the admin, in the editor. Students and exports never see it. |

## Content requirements

4. `slot` and `course` are copied from the table character-for-character. Never guess or invent them. `creditHours` is the one value you decide yourself (see above).
5. Never change the title. Never add lesson numbers, IDs or chapter prefixes to a title.
6. Structure every lesson as: 1 `heading` → 1–2 `text` paragraphs (80–180 words each) →
   3–6 `step` blocks if the lesson teaches a procedure → 1 `callout` (`tip`) → optional `image` / `youtube`.
   Place an `imageHint` right after every paragraph or step that a picture would explain better (usually 2–5 per lesson).
7. Studio-teacher voice: concrete, actionable, no filler, no "in this lesson we will".
8. Every English field gets a matching `textAm` in Ethiopic script with the same meaning.
   Keep proper nouns (Caravaggio, Bauhaus, EOTC, Part IV, Ge'ez) in Latin script.
9. `image`: only when you were given a real Cloudinary URL. Never invent a path and never use a fake placeholder URL.
   Where a picture is wanted but you have no URL, write an `imageHint` block instead (text + textAm describe exactly what the picture must show).
10. `youtube`: only real, relevant videos you are confident exist. If unsure, omit the block.
11. Valid JavaScript only: no HTML, no markdown, no template literals, no comments inside strings.

## What the teacher does with your output

Saves each file under `server/src/data/lessons/` and runs `node src/validate-lessons.js`.
The slot id decides where the lesson appears in the app — the folder does not matter.
