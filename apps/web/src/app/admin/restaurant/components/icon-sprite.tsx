/**
 * SVG <symbol> defs referenced via <use href="#ic-x"/> from every component
 * on this page. Rendered once here (ids are page-global) rather than
 * duplicated per-component.
 *
 * Pruned to only what's actually used after the wireframe-fidelity rebuild
 * of the header, Table Themes, and Compliance Documents (2026-08-08) - most
 * of the status/action iconography (check, star, chevron, lock, external
 * link, alert, upload, eye, swap) and every per-theme category glyph
 * (deep-talk, network, creative, founder, family, date, general, tech,
 * wellness) were dropped in favor of the wireframe's literal text/character
 * treatment (e.g. "✓ Verified", "4.7 ★", "Team Members →") or removed
 * along with the UI they supported (theme category icons, doc view/replace
 * buttons). ic-shield is still used by ApplicationInfoCard's
 * pre-verification "Add details" prompt, which is outside the wireframe's
 * spec for this pass and was left as-is.
 */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <symbol id="ic-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M13.5 3.5V8.5h5" /></symbol>
      <symbol id="ic-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9.5 7V5h5v2" /><path d="M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7" /></symbol>
      <symbol id="ic-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></symbol>
      <symbol id="ic-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v6c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-3Z" /><polyline points="9 12 11 14 15 10" /></symbol>
    </svg>
  );
}
