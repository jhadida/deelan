# PWA Offline Caching

Deelan uses a service worker for offline-first browsing after first load.

## Files

- Service worker: `public/service-worker.js`
- Registration script: `public/js/pwa-register.js`
- Offline fallback page: `public/offline.html`

## Caching Strategy

- Pre-cache on install:
    - `/`
    - `/posts/`
    - `/snippets/`
    - `/offline.html`
    - `/js/filter.js`
    - `/js/search-core.js`
    - `/js/pwa-register.js`
    - `/mathjax/tex-mml-chtml.js`
- Navigation requests: network-first with offline fallback page
- Static assets (`/_astro/`, `/js/`, `/mathjax/`): cache-first
- JSON requests: stale-while-revalidate
- Old caches are purged on activation based on cache version

## Update Prompt Behavior

When a new service worker is installed and an older one is controlling the page:

1. The UI prompts the user to reload.
2. On confirmation, `SKIP_WAITING` is sent.
3. Page reloads on `controllerchange`.

## Versioning

Cache version is set in `public/service-worker.js`:

- `CACHE_VERSION = 'deelan-v2'`

Bump this value when changing caching behavior/assets to force a clean cache upgrade.

## Development Notes

Service workers can retain stale assets across local iterations.

To reset manually in browser devtools:

1. Application tab -> Service Workers -> Unregister
2. Application tab -> Storage -> Clear site data

Then reload the app.
