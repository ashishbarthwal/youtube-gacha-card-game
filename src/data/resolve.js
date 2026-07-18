/* data/resolve — @handle | URL | UC id  ->  { kind, value } | { error }
   Handles and UC ids only; /c/ and /user/ vanity URLs are out of scope
   (see DECISIONS.md). Imports nothing. */

const UC_ID = /^UC[0-9A-Za-z_-]{22}$/;
const HANDLE = /^@[A-Za-z0-9._-]{3,30}$/;

export function resolveChannelInput(raw) {
  const input = String(raw ?? '').trim();
  if (!input) return { error: 'Enter a handle, channel URL, or UC id.' };
  if (UC_ID.test(input)) return { kind: 'id', value: input };

  if (input.includes('/')) {
    let url = null;
    try { url = new URL(input.includes('://') ? input : 'https://' + input); } catch { /* fall through */ }
    if (url && /(^|\.)youtube\.com$/i.test(url.hostname)) {
      const path = url.pathname.replace(/\/+$/, '');
      const handleMatch = path.match(/^\/(@[A-Za-z0-9._-]{3,30})$/);
      if (handleMatch) return { kind: 'handle', value: handleMatch[1] };
      const idMatch = path.match(/^\/channel\/(UC[0-9A-Za-z_-]{22})$/);
      if (idMatch) return { kind: 'id', value: idMatch[1] };
      if (path.startsWith('/c/') || path.startsWith('/user/')) {
        return { error: 'Vanity URLs are not supported — use the @handle or UC id instead.' };
      }
    }
    return { error: 'Could not read a channel from that URL. Try youtube.com/@handle or youtube.com/channel/UC…' };
  }

  const handle = input.startsWith('@') ? input : '@' + input;
  if (HANDLE.test(handle)) return { kind: 'handle', value: handle };
  return { error: 'Could not read that as a handle, channel URL, or UC id.' };
}
