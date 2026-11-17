// Helpers for the infinitely nested category tree (Fine Art → Oil Painting → Brushwork → Impasto …).
// Categories are few, so the whole list is loaded once and cached briefly; every admin change calls invalidateTree().
import { Category } from './models/index.js';

let cache = null;
let cachedAt = 0;

export async function getCategories() {
  if (cache && Date.now() - cachedAt < 15_000) return cache;
  const list = await Category.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  const byId = new Map(list.map((c) => [String(c._id), c]));
  const children = new Map();
  for (const c of list) {
    const p = c.parent && byId.has(String(c.parent)) ? String(c.parent) : null; // orphans become major groups
    if (!children.has(p)) children.set(p, []);
    children.get(p).push(c);
  }
  cache = { list, byId, children };
  cachedAt = Date.now();
  return cache;
}

export const invalidateTree = () => { cache = null; };

/** [self, parent, grandparent, …, major group] as string ids. */
export async function ancestorIds(categoryId) {
  const { byId } = await getCategories();
  const out = [];
  const seen = new Set();
  let cur = byId.get(String(categoryId));
  while (cur && !seen.has(String(cur._id))) {
    seen.add(String(cur._id));
    out.push(String(cur._id));
    cur = cur.parent ? byId.get(String(cur.parent)) : null;
  }
  return out;
}

/** Same as ancestorIds but returns the category documents. */
export async function ancestorChain(categoryId) {
  const { byId } = await getCategories();
  return (await ancestorIds(categoryId)).map((id) => byId.get(id));
}

/** self + every sub-group below it (string ids). */
export async function descendantIds(categoryId) {
  const { children } = await getCategories();
  const out = [];
  const stack = [String(categoryId)];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const ch of children.get(id) || []) stack.push(String(ch._id));
  }
  return out;
}

/** Would moving `id` under `newParent` create a loop? */
export async function wouldCycle(id, newParent) {
  if (!newParent) return false;
  return (await ancestorIds(newParent)).includes(String(id));
}

/** Drop selected ids that are already covered by a selected ancestor (parent + child selected → parent only). */
export async function normalizeSelection(ids) {
  const { byId } = await getCategories();
  const set = new Set(ids.map(String).filter((id) => byId.has(id)));
  const out = [];
  for (const id of set) {
    const anc = (await ancestorIds(id)).slice(1);
    if (!anc.some((a) => set.has(a))) out.push(id);
  }
  return out;
}

/** Breadcrumb [{id,title,titleAm,slug}] from major group down to this category. */
export async function breadcrumb(categoryId) {
  return (await ancestorChain(categoryId)).reverse().map((c) => ({
    id: String(c._id), title: c.title, titleAm: c.titleAm, slug: c.slug, priceEtb: c.priceEtb || 0, isFree: !!c.isFree,
  }));
}
