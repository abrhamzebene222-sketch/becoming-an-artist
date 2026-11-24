// Back-navigation helpers shared by the header back arrow and the Android hardware Back button.

const handlers = []; // LIFO stack: the most recently opened thing (menu, modal...) closes first

/** Register something that should close on Back. fn() returns true if it handled the press. Returns an unregister function. */
export function registerBackHandler(fn) {
  handlers.push(fn);
  return () => {
    const i = handlers.lastIndexOf(fn);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/** Let registered handlers (open menu, etc.) consume the Back press. */
export function runBackHandlers() {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true;
  }
  return false;
}

/** The "main" screen where Back should not go any further. */
export function isRootPath(pathname, user) {
  if (pathname === '/' || pathname === '/admin') return true;
  if (pathname === '/catalog' && !user) return true; // guests start at the catalog
  return false;
}

/** Logical parent: lesson -> course -> catalog -> dashboard. */
export function parentPath(pathname) {
  if (/^\/courses\/[^/]+\/lessons\/[^/]+\/?$/.test(pathname)) return pathname.replace(/\/lessons\/[^/]+\/?$/, '');
  if (/^\/courses\/[^/]+\/?$/.test(pathname)) return '/catalog';
  if (/^\/news\/[^/]+\/?$/.test(pathname)) return '/news';
  if (pathname.startsWith('/admin/')) return '/admin';
  return '/';
}

/**
 * Go one step back. Uses real history when there is one (so you return to where you came from),
 * otherwise (page opened directly / after a refresh) goes to the logical parent.
 * Returns false when already at the root (nothing to go back to).
 */
export function goBack(navigate, pathname, user) {
  const idx = window.history.state && typeof window.history.state.idx === 'number' ? window.history.state.idx : 0;
  if (idx > 0) { navigate(-1); return true; }
  if (isRootPath(pathname, user)) return false;
  navigate(parentPath(pathname), { replace: true });
  return true;
}
