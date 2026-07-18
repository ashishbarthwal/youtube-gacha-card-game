/* ui/util — shared formatting/escaping helpers used across UI modules. */

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function formatCount(n) {
  const trim = x => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10).toString();
  if (n >= 1e9) return trim(n / 1e9) + 'B';
  if (n >= 1e6) return trim(n / 1e6) + 'M';
  if (n >= 1e3) return trim(n / 1e3) + 'K';
  return String(n);
}
