import { useEffect } from 'react';

/** Slug of the major group (chapter) that is the children's / teens' section. All its courses start with it too. */
export const KIDS_SLUG = 'young-artists-club';

export const isKidsSlug = (slug) => typeof slug === 'string' && slug.startsWith(KIDS_SLUG);

/** True for a course (API shape of GET /courses/:slug) that lives inside the Young Artists Club. */
export const isKidsCourse = (c) => !!c && (isKidsSlug(c.slug) || c.majorGroup?.slug === KIDS_SLUG || (c.breadcrumb || []).some((b) => b.slug === KIDS_SLUG));

const KIDS_THEME_COLOR = '#1D1140';

/**
 * While `on` is true the whole app (page background, menu, cards, buttons) switches to the playful kids palette
 * by adding `theme-kids` to <html>. It is removed again when the page closes or `on` turns false.
 */
export default function useKidsTheme(on) {
  useEffect(() => {
    if (!on) return undefined;
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const prev = meta ? meta.getAttribute('content') : null;
    root.classList.add('theme-kids');
    if (meta) meta.setAttribute('content', KIDS_THEME_COLOR);
    return () => {
      root.classList.remove('theme-kids');
      if (meta && prev) meta.setAttribute('content', prev);
    };
  }, [on]);
}
