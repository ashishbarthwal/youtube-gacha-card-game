/* data — the seam. demo, sets (planned), and live sources all produce this
   identical Channel shape, so nothing downstream can tell them apart. That
   is why the app runs offline, why tests never need an API key, and why
   demo mode is a real adapter rather than a hack.

   @typedef {Object} Channel
   @property {string}  id                     UC… channel id
   @property {string}  title
   @property {string}  handle                 "@name", or "" when unknown
   @property {string}  avatarUrl
   @property {string=} subscriberCount        decimal string; absent when hidden
   @property {boolean} hiddenSubscriberCount
   @property {string}  viewCount              decimal string
   @property {string}  videoCount             decimal string
 */

export { DEMO_CHANNELS } from './demo.js';
export { fetchLiveChannel } from './youtube.js';
export { resolveChannelInput } from './resolve.js';
