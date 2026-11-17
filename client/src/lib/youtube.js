/** youtube.com/watch?v=…, youtu.be/…, /shorts/…, /embed/… → 11-character id ('' if not YouTube). */
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
export const youtubeThumb = (id) => (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');
