// Client helpers for the nested category tree.

/** Flat list (each item has `parent`) → nested roots with `children`. */
export function buildTree(flat) {
  const nodes = new Map(flat.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  for (const n of nodes.values()) {
    const p = n.parent && nodes.get(n.parent);
    (p ? p.children : roots).push(n);
  }
  const sort = (list) => { list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); list.forEach((n) => sort(n.children)); return list; };
  return sort(roots);
}

/** Depth-first list with depth, e.g. for indented <select> options. */
export function flatten(roots, depth = 0, out = []) {
  for (const n of roots) { out.push({ ...n, depth }); flatten(n.children || [], depth + 1, out); }
  return out;
}

/** Ids of a node and everything below it. */
export function subtreeIds(node, out = new Set()) {
  out.add(node.id);
  (node.children || []).forEach((c) => subtreeIds(c, out));
  return out;
}

/** Map id → node for a nested tree. */
export function indexTree(roots, map = new Map(), parent = null) {
  for (const n of roots) { map.set(n.id, { node: n, parent }); indexTree(n.children || [], map, n.id); }
  return map;
}
