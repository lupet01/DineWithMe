const EXACT_MATCH_ONLY = new Set(["/admin", "/admin/ops"]);

/**
 * A route is "active" for a nav item if it matches exactly, or is a
 * sub-path of it - except /admin and /admin/ops, which would otherwise
 * match every admin route since all of them start with that prefix.
 */
function matchesHref(pathname: string | null, href: string) {
  return pathname === href || (!EXACT_MATCH_ONLY.has(href) && pathname?.startsWith(href + "/"));
}

export function isPathActive(pathname: string | null, hrefs: string[]) {
  return hrefs.some((href) => matchesHref(pathname, href));
}
