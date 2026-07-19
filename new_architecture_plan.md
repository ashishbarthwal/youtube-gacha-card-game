
# YouTube Gacha - Backend Architecture Plan

## Goals

This project should:

- Use the official YouTube Data API.
- Never expose the API key to clients.
- Minimize API usage through aggressive caching.
- Scale from hobby project to thousands of users.
- Keep card pulls instant.
- Continue functioning even if YouTube temporarily becomes unavailable.

---

# High-Level Architecture

    Browser
                       │
                       ▼
                 Next.js Frontend
                       │
                       ▼
                 Internal API Route
                       │
                       ▼
                  Card Service
                       │
      ┌────────────────┴────────────────┐
      │                                 │
      ▼                                 ▼
 Redis / Memory Cache             PostgreSQL
      │                                 │
      └──────────────┬──────────────────┘
                     │
          Cache miss or stale?
                     │
                   YES
                     │
                     ▼
          YouTube Data API v3
                     │
                     ▼
          Normalize channel data
                     │
                     ▼
       Store + Refresh cache/database
                     │
                     ▼
             Return card JSON

---

# Core Principle

The frontend NEVER communicates directly with YouTube.

The frontend only requests

/api/card/{channelId}

The backend decides whether fresh data is needed.

---

# Data Flow

Player opens card

↓

Backend checks Redis

↓

If found AND not expired

↓

Return immediately

ELSE

↓

Check PostgreSQL

↓

If fresh enough

↓

Return

ELSE

↓

Fetch latest YouTube data

↓

Update database

↓

Update Redis

↓

Return card

---

# Why Redis?

Redis exists only for speed.

Instead of reading PostgreSQL hundreds of times every minute, frequently requested cards remain in memory.

Typical TTL:

6 hours

---

# Why PostgreSQL?

Redis is temporary.

Postgres stores

- channel id
- channel name
- avatar URL
- subscriber count
- thumbnails
- statistics
- last_updated
- cached rarity
- card metadata

Redis can disappear at any time.

Postgres is the permanent source of cached channel information.

---

# Cache Strategy

Redis TTL

6 hours

Database refresh interval

24 hours

Meaning:

Player requests MrBeast

↓

Redis?

YES

↓

Done

Player requests MrBeast after TTL expires

↓

Redis miss

↓

Database record exists

↓

Was updated today?

YES

↓

Repopulate Redis

↓

Done

Database older than 24 hours

↓

Refresh from YouTube API

↓

Update DB

↓

Update Redis

↓

Return

---

# API Usage Philosophy

Never fetch during gameplay unless necessary.

Treat YouTube as a periodic synchronization source.

Example:

2000 creators

Refresh every 24 hours

=

2000 YouTube requests/day

This easily fits within the default YouTube Data API quota.

Even if

100,000

players play,

they all read cached data.

---

# Avatar Images

Do NOT store creator avatars permanently.

Store only

avatar_url

returned by YouTube.

Recommended:

Use Cloudflare CDN (or Vercel Image Optimization) to cache the image.

Advantages

- reduced bandwidth
- faster loading
- no repeated downloads
- automatic cache expiration

The application never owns the artwork.

It only references publicly available URLs.

---

# Pull System

A card pull should NEVER call YouTube.

It should only read cached card data.

Flow

Player presses Pull x10

↓

Backend randomly selects channel IDs

↓

Load card data from Redis

↓

Return cards

Done.

No external requests.

---

# Randomization

Maintain a rarity table.

Example

Common (N)

55%

Rare (R)

27%

Super Rare (SR)

12%

SSR

5%

Ultra Rare (UR)

1%

Each creator belongs to one rarity tier.

Randomness occurs entirely inside the backend.

---

# Background Refresh Job

Create a scheduled worker.

Runs every hour.

Each run

Find channels older than 24 hours

↓

Refresh from YouTube

↓

Update DB

↓

Update Redis

This prevents players from ever waiting for API calls.

---

# Suggested Database Schema

Table: channels

channel_id

PRIMARY KEY

channel_name

avatar_url

subscriber_count

video_count

view_count

rarity

attack

defense

last_updated

---

# Card Generation

Cards are generated dynamically.

Nothing visual is permanently stored.

Card =

avatar_url
+
channel_name
+
subscriber_count
+
rarity
+
stats

↓

React Component

This means visual updates happen automatically when data refreshes.

---

# Scaling

Stage 1

Localhost

↓

SQLite

↓

Memory cache

---

Stage 2

Vercel

↓

Railway

↓

PostgreSQL

↓

Redis

---

Stage 3

Cloudflare CDN

↓

Redis

↓

Postgres

↓

Background refresh workers

Supports large numbers of concurrent players without significant architectural changes.

---

# Security

Never expose the YouTube API key.

The browser should never know it exists.

Only the backend communicates with Google APIs.

---

# Nice Future Features

- Player inventories
- Trading
- Daily free pulls
- Leaderboards
- Seasonal banners
- Pack history
- Limited-time events
- Dynamic stat balancing
- Search for creators
- Auto-add new channels
- Favorite creators
- Card evolution
- Holographic variants
- Alternate artwork (generated frame only, never modifying creator avatars)

---

# Design Philosophy

The game should feel like a trading card game—not a YouTube client.

YouTube provides public metadata.

The game transforms that metadata into its own gameplay systems:

- rarity
- attack
- defense
- collection
- pulls
- progression

The gameplay layer belongs entirely to this project.
