/* data/youtube — live adapter for YouTube Data API v3.
   Returns the same Channel shape as demo (see ./index.js). The key is a
   plain argument: never logged, never persisted, only ever sent to
   googleapis.com. */

const YT_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels';

/* customUrl is the API's handle field, but it is not guaranteed to be
   handle-shaped: older channels return a bare, lowercased vanity string
   ("mkbhd") while the modern format is "@mkbhd". Normalize to the "@name"
   shape the Channel typedef promises, so live matches demo and sets. */
function normalizeHandle(customUrl) {
  const raw = String(customUrl ?? '').trim();
  if (!raw) return '';
  return raw.startsWith('@') ? raw : '@' + raw;
}

export async function fetchLiveChannel(resolved, apiKey) {
  const params = new URLSearchParams({ part: 'snippet,statistics', key: apiKey });
  if (resolved.kind === 'handle') params.set('forHandle', resolved.value);
  else params.set('id', resolved.value);

  let res;
  try {
    res = await fetch(`${YT_ENDPOINT}?${params}`);
  } catch {
    throw new Error('Network error — could not reach the YouTube API.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') throw new Error('API quota exceeded for this key — resets daily.');
    if (res.status === 400 || res.status === 403) {
      throw new Error('The API rejected the key. Check it is valid and YouTube Data API v3 is enabled.');
    }
    throw new Error(`YouTube API error (HTTP ${res.status}).`);
  }
  const item = body.items?.[0];
  if (!item) throw new Error('No channel found for that input.');
  const stats = item.statistics ?? {};
  return {
    id: item.id,
    title: item.snippet?.title ?? 'Untitled channel',
    handle: normalizeHandle(item.snippet?.customUrl),
    // Prefer the largest thumbnail: the redesigned card shows the avatar in a
    // big ring, where the 88px "default" would look soft. high=800, medium=240.
    avatarUrl: item.snippet?.thumbnails?.high?.url
            ?? item.snippet?.thumbnails?.medium?.url
            ?? item.snippet?.thumbnails?.default?.url ?? '',
    subscriberCount: stats.subscriberCount,
    hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
    viewCount: stats.viewCount ?? '0',
    videoCount: stats.videoCount ?? '0',
  };
}
