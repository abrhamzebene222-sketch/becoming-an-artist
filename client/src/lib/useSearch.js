import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Where a search result opens. If lesson pages ever move, change them here only.
export const courseHref = (course) => `/courses/${course.slug}`;
export const lessonHref = (lesson) => `/courses/${lesson.courseSlug}/lessons/${lesson.id}`;

/** A query is worth sending when it has 2+ characters (1 is enough for an Amharic syllable). */
export const searchable = (q) => {
  const s = (q || '').trim();
  return s.length >= 2 || (s.length === 1 && /[\u1200-\u137F]/.test(s));
};

/**
 * Live search over courses and lessons: GET /search.
 * Waits `debounce` ms after the last keystroke and ignores answers that arrive late.
 * Returns { data, loading, error, active }  — active = the query is long enough to search.
 */
export default function useSearch(q, { courses = 6, lessons = 12, debounce = 250 } = {}) {
  const text = (q || '').trim();
  const [term, setTerm] = useState(text);
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!debounce) { setTerm(text); return undefined; }
    const id = setTimeout(() => setTerm(text), debounce);
    return () => clearTimeout(id);
  }, [text, debounce]);

  useEffect(() => {
    if (!searchable(term)) { setState({ data: null, loading: false, error: null }); return undefined; }
    let stale = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(`/search?q=${encodeURIComponent(term)}&courses=${courses}&lessons=${lessons}`)
      .then((data) => { if (!stale) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!stale) setState({ data: null, loading: false, error }); });
    return () => { stale = true; };
  }, [term, courses, lessons]);

  const active = searchable(text);
  return { ...state, active, loading: active && (state.loading || term !== text) };
}
