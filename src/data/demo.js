/* data/demo — eight fictional channels, generated avatars, zero network.
   Counts are strings, exactly as the live API returns them, so the pure
   core is exercised identically in both modes. Emits the Channel shape
   documented in ./index.js. */

function demoAvatar(initial, hue) {
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

export const DEMO_CHANNELS = [
  {
    id: 'UCdemo-pixel-foundry',
    title: 'Pixel Foundry',
    handle: '@pixelfoundry',
    avatarUrl: demoAvatar('P', 212),
    subscriberCount: '42300',
    hiddenSubscriberCount: false,
    viewCount: '3100000',
    videoCount: '214',
  },
  {
    id: 'UCdemo-unlisted-archive',
    title: 'The Unlisted Archive',
    handle: '@unlistedarchive',
    avatarUrl: demoAvatar('U', 132),
    /* subscriberCount intentionally absent — this channel hides it */
    hiddenSubscriberCount: true,
    viewCount: '5400000',
    videoCount: '97',
  },
  {
    id: 'UCdemo-midnight-ramen',
    title: 'Midnight Ramen',
    handle: '@midnightramen',
    avatarUrl: demoAvatar('M', 24),
    subscriberCount: '384000',
    hiddenSubscriberCount: false,
    viewCount: '41000000',
    videoCount: '327',
  },
  {
    id: 'UCdemo-glasshouse-audio',
    title: 'Glasshouse Audio',
    handle: '@glasshouseaudio',
    avatarUrl: demoAvatar('G', 282),
    subscriberCount: '641000',
    hiddenSubscriberCount: false,
    viewCount: '88000000',
    videoCount: '156',
  },
  {
    id: 'UCdemo-kaiju-kitchen',
    title: 'Kaiju Kitchen',
    handle: '@kaijukitchen',
    avatarUrl: demoAvatar('K', 350),
    subscriberCount: '2700000',
    hiddenSubscriberCount: false,
    viewCount: '512000000',
    videoCount: '388',
  },
  {
    id: 'UCdemo-orbit-and-oak',
    title: 'Orbit & Oak',
    handle: '@orbitandoak',
    avatarUrl: demoAvatar('O', 196),
    subscriberCount: '6400000',
    hiddenSubscriberCount: false,
    viewCount: '1200000000',
    videoCount: '240',
  },
  {
    id: 'UCdemo-daily-meteor',
    title: 'The Daily Meteor',
    handle: '@thedailymeteor',
    avatarUrl: demoAvatar('D', 44),
    subscriberCount: '14200000',
    hiddenSubscriberCount: false,
    viewCount: '9800000000',
    videoCount: '3120',
  },
  {
    id: 'UCdemo-supernova-plays',
    title: 'SuperNova Plays',
    handle: '@supernovaplays',
    avatarUrl: demoAvatar('S', 4),
    subscriberCount: '61000000',
    hiddenSubscriberCount: false,
    viewCount: '32000000000',
    videoCount: '5480',
  },
];
