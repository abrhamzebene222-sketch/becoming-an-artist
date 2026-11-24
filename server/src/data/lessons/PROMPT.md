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
  blocks: [
    { type: 'heading', text: 'What critique is for', textAm: 'ግምገማ ለምን እንደሚያገለግል' },
    { type: 'text', text: 'English body…', textAm: 'የአማርኛ ጽሑፍ…' },
    { type: 'step', text: 'First step…', textAm: 'የመጀመሪያ ደረጃ…' },
    { type: 'callout', variant: 'tip', text: 'A studio tip…', textAm: 'የስቱዲዮ ምክር…' },
    { type: 'image', imageUrl: 'https://res.cloudinary.com/…', publicId: 'blocks/…', caption: 'Plate 3' },
    { type: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=…', caption: 'Demonstration' },
  ],
};
```

## The six block types — no others exist

| type | required | rules |
|---|---|---|
| `heading` | `text` | short section title, max 300 characters. Resets step numbering to 1. |
| `text` | `text` | body paragraph, max 20 000 characters. |
| `step` | `text` | one numbered procedure step. Numbering is automatic — never write "Step 1" yourself. Restarts after a `heading`. |
| `callout` | `text`, `variant` | `variant: 'tip'` or `'warning'`. Max 5 000 characters. |
| `image` | `imageUrl` | also give `publicId` when you know it; `caption` optional. |
| `youtube` | `youtubeUrl` | a real youtube.com / youtu.be link; the server extracts the 11-character id. |

## Content requirements

4. `slot` and `course` are copied from the table character-for-character. Never guess or invent them.
5. Never change the title. Never add lesson numbers, IDs or chapter prefixes to a title.
6. Structure every lesson as: 1 `heading` → 1–2 `text` paragraphs (80–180 words each) →
   3–6 `step` blocks if the lesson teaches a procedure → 1 `callout` (`tip`) → optional `image` / `youtube`.
7. Studio-teacher voice: concrete, actionable, no filler, no "in this lesson we will".
8. Every English field gets a matching `textAm` in Ethiopic script with the same meaning.
   Keep proper nouns (Caravaggio, Bauhaus, EOTC, Part IV, Ge'ez) in Latin script.
9. `image`: only a Cloudinary URL the teacher will paste in. With no real URL use
   `https://res.cloudinary.com/REPLACE-ME/image/upload/v1/placeholder.jpg` plus
   `caption: 'Replace with your own upload'`. Never invent a working-looking path.
10. `youtube`: only real, relevant videos you are confident exist. If unsure, omit the block.
11. Valid JavaScript only: no HTML, no markdown, no template literals, no comments inside strings.

## What the teacher does with your output

Saves each file under `server/src/data/lessons/` and runs `node src/validate-lessons.js`.
The slot id decides where the lesson appears in the app — the folder does not matter.
