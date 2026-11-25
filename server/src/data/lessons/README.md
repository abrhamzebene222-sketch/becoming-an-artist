# src/data/lessons — AI-written lesson content

One file per lesson. Folder is cosmetic; placement comes from `slot` + `course` inside the file.

    node src/validate-lessons.js          # check, no database
    node src/import-lessons.js            # dry run
    node src/import-lessons.js --apply    # write to MongoDB

Print a ready-made prompt for the next batch:

    node src/prompt.js L014 L015 L016 L017 L018
    node src/prompt.js --course=<course-slug>
    node src/prompt.js --chapter=2 --limit=5

## Contract

```js
export default {
  slot: 'L014',                        // from lesson-slots.csv — decides the position
  course: 'drawing-fundamentals--…',   // must match the slot's course slug exactly
  title: 'The Manifest Title',         // the app keeps the manifest title anyway
  titleAm: '…',                        // optional; correct it only if the translation is wrong
  creditHours: 1.5,                    // lesson size → price (= creditHours × price per credit hour in Admin › Settings)
  blocks: [ /* text | heading | step | callout | image | youtube | imageHint */ ],
};
```

## Credit hours

`creditHours` decides what the lesson costs: **price = creditHours × the credit-hour rate** (Admin › Settings).
Theory 0.5–1 · mixed 1–2 · practical 1.5–3. Allowed: 0.1 – 10. Missing → the validator warns and the app uses the
default credit hours from Settings. A lesson with no content yet is not sold and adds nothing to a price.
Re-importing (even without `--force`) fills in a missing `creditHours` on an existing lesson but never changes one you already set
— change it later in Admin › Courses › the lesson.

## Seven block types

| type | fields | notes |
|---|---|---|
| `heading` | `text`, `textAm` | ≤300 chars, resets step numbering |
| `text` | `text`, `textAm` | ≤20 000 chars |
| `step` | `text`, `textAm`, optional `image` + `caption` | numbered automatically |
| `callout` | `text`, `textAm`, `variant: 'tip' \| 'warning'` | ≤5 000 chars |
| `image` | `imageUrl` (+ `publicId`), `caption` | Cloudinary only |
| `youtube` | `youtubeUrl`, `caption` | id extracted server-side |
| `imageHint` | `text`, `textAm` | admin-only "add image here" slot (describes the picture to add); never shown to students or in exports |

Images: upload in Admin › Courses first, copy both the URL and the public id.
An image without `publicId` still displays, but the admin editor drops it if you later save that lesson.

## Rules

1. `slot` and `course` are copied verbatim — never retyped from memory.
2. Filename starts with the slot id: `L014-the-four-step-critique.js`.
3. Re-importing never overwrites a lesson that already has content (use `--force` when you mean it).
