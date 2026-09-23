# National-scale expansion

The frontend now treats location as a Rwanda-wide hierarchy rather than a Kigali-only string:

`Province → District → Sector → Cell → Village`

The local catalogue includes all five provinces and 30 districts. Sector, Cell, and Village values are fetched through `/api/locations`, which proxies the Rwanda administrative-boundary service and returns distinct values for the selected parent. In production this endpoint should be backed by a versioned, cached national directory with stable administrative IDs.

National rollout requirements for the backend:

- Store administrative IDs and names on every Listing; do not rely on free-text location matching.
- Cache the directory by level and parent ID so listing creation and search remain fast on 3G/4G.
- Keep location data independent from listing content so boundary updates do not require a frontend release.
- Index Province, District, Sector, and GPS fields for drill-down search and future map results.
- Use the same directory for listing validation, moderation, analytics, and notifications.
- Keep media, payments, KYC, and notification services modular so traffic can scale beyond Kigali without changing the listing contract.

The current browser build intentionally keeps demo persistence in localStorage. The boundary proxy is the first backend seam for replacing demo storage with the shared API described in the SRS.
