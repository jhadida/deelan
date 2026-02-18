# PWA Offline Caching (Phase 1)

DEELAN now uses a service worker for offline-first browsing after first load.

## Files

- Service worker: `public/service-worker.js`
- Registration script: `public/js/pwa-register.js`

## Caching Strategy

- Pre-cache on install:
  - `/`
  - `/posts/`
  - `/snippets/`
  - `/js/filter.js`
  - `/js/pwa-register.js`
  - `/mathjax/tex-mml-chtml.js`
- Navigation requests: network-first with cache fallback
- Static assets (`/_astro/`, `/js/`, `/mathjax/`): cache-first
- Old caches are purged on activation based on cache version

## Versioning

Cache version is set in `public/service-worker.js`:

- `CACHE_VERSION = 'deelan-v1'`

Bump this value when changing caching behavior/assets to force a clean cache upgrade.

## Development Notes

Service workers can retain stale assets across local iterations.

To reset manually in browser devtools:

1. Application tab -> Service Workers -> Unregister
2. Application tab -> Storage -> Clear site data

Then reload the app.
