/* data/starter — the bundled starter set: eight fictional channels with
   generated avatars and zero network. It is the built-in sampler, the app's
   default pool, and the offline fallback — always available even if the
   fetchable set manifest (sets/index.json) cannot be loaded.

   Authored as a full set envelope so it flows through the same parseSet →
   toCard path as any fetched set; nothing downstream can tell it apart. It
   ships inside the JS bundle rather than as a fetched file precisely so the
   default view paints instantly with no network round-trip. One channel hides
   its subscriber count on purpose, keeping that branch exercised by real use. */

function avatar(initial, hue) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},72%,52%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 40) % 360},68%,34%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="120" height="120" fill="url(#g)"/>` +
    `<text x="60" y="62" font-family="Arial Black, Arial, sans-serif" font-size="56" font-weight="900" ` +
    `fill="rgba(255,255,255,0.92)" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* No snapshotDate: these are invented channels, not a real snapshot, so the
   card view shows no "stats as of <month>" label — the absence signals the
   built-in sampler apart from a real, dated Series. */
export const STARTER_SET = {
  slug: 'starter',
  title: 'Starter Set',
  series: 'Starter',
  snapshotDate: '',
  channels: [
    {
      id: 'UCstarter-pixel-foundry',
      title: 'Pixel Foundry',
      handle: '@pixelfoundry',
      avatarUrl: avatar('P', 212),
      subscriberCount: '42300',
      hiddenSubscriberCount: false,
      viewCount: '3100000',
      videoCount: '214',
    },
    {
      id: 'UCstarter-unlisted-archive',
      title: 'The Unlisted Archive',
      handle: '@unlistedarchive',
      avatarUrl: avatar('U', 132),
      /* subscriberCount intentionally absent — this channel hides it */
      hiddenSubscriberCount: true,
      viewCount: '5400000',
      videoCount: '97',
    },
    {
      id: 'UCstarter-midnight-ramen',
      title: 'Midnight Ramen',
      handle: '@midnightramen',
      avatarUrl: avatar('M', 24),
      subscriberCount: '384000',
      hiddenSubscriberCount: false,
      viewCount: '41000000',
      videoCount: '327',
    },
    {
      id: 'UCstarter-glasshouse-audio',
      title: 'Glasshouse Audio',
      handle: '@glasshouseaudio',
      avatarUrl: avatar('G', 282),
      subscriberCount: '641000',
      hiddenSubscriberCount: false,
      viewCount: '88000000',
      videoCount: '156',
    },
    {
      id: 'UCstarter-kaiju-kitchen',
      title: 'Kaiju Kitchen',
      handle: '@kaijukitchen',
      avatarUrl: avatar('K', 350),
      subscriberCount: '2700000',
      hiddenSubscriberCount: false,
      viewCount: '512000000',
      videoCount: '388',
    },
    {
      id: 'UCstarter-orbit-and-oak',
      title: 'Orbit & Oak',
      handle: '@orbitandoak',
      avatarUrl: avatar('O', 196),
      subscriberCount: '6400000',
      hiddenSubscriberCount: false,
      viewCount: '1200000000',
      videoCount: '240',
    },
    {
      id: 'UCstarter-daily-meteor',
      title: 'The Daily Meteor',
      handle: '@thedailymeteor',
      avatarUrl: avatar('D', 44),
      subscriberCount: '14200000',
      hiddenSubscriberCount: false,
      viewCount: '9800000000',
      videoCount: '3120',
    },
    {
      id: 'UCstarter-supernova-plays',
      title: 'SuperNova Plays',
      handle: '@supernovaplays',
      avatarUrl: avatar('S', 4),
      subscriberCount: '61000000',
      hiddenSubscriberCount: false,
      viewCount: '32000000000',
      videoCount: '5480',
    },
  ],
};
