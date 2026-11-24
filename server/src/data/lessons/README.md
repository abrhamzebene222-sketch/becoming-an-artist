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
  blocks: [ /* text | heading | step | callout | image | youtube */ ],
};
```

## Six block types (revised app)

| type | fields | notes |
|---|---|---|
| `heading` | `text`, `textAm` | ≤300 chars, resets step numbering |
| `text` | `text`, `textAm` | ≤20 000 chars |
| `step` | `text`, `textAm`, optional `image` + `caption` | numbered automatically |
| `callout` | `text`, `textAm`, `variant: 'tip' \| 'warning'` | ≤5 000 chars |
| `image` | `imageUrl` (+ `publicId`), `caption` | Cloudinary only |
| `youtube` | `youtubeUrl`, `caption` | id extracted server-side |

Images: upload in Admin › Courses first, copy both the URL and the public id.
An image without `publicId` still displays, but the admin editor drops it if you later save that lesson.

## Rules

1. `slot` and `course` are copied verbatim — never retyped from memory.
2. Filename starts with the slot id: `L014-the-four-step-critique.js`.
3. Re-importing never overwrites a lesson that already has content (use `--force` when you mean it).
