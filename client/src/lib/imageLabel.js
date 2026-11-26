// Automatic picture labels (number 9). The server sends `labelBase` / `labelBaseAm`
// (chapter / groups / lesson title, already shortened); the number comes from the picture's position.

/** Picture numbers in reading order. Works for student blocks (id, imageUrl) and editor blocks (_k, image). */
export function imageNumbers(blocks = []) {
  const out = {};
  let n = 0;
  for (const b of blocks) {
    if ((b.type === 'image' || b.type === 'step') && (b.imageUrl || b.image?.url)) { n += 1; out[b.id ?? b._k ?? b._id] = n; }
  }
  return out;
}

/** "Chapter / Group / Lesson 2" in the current language (Amharic falls back to English). */
export function imageLabel(base, baseAm, lang, n) {
  const b = (lang === 'am' && baseAm) || base || baseAm || '';
  return b && n ? `${b} ${n}` : '';
}
