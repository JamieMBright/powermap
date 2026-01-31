# Jamie's TODO List

Items that require manual action (cannot be automated due to proxy/access restrictions).

---

## 1. Download Real Boundary Data from UKPN Open Data Portal

The current boundary files contain placeholder rectangles. Replace them with real geographic data.

### Step 1: Download GeoJSON Files

Visit each link below and click **Export** → **GeoJSON**:

| Boundary Type | Download Link | Save As |
|---------------|---------------|---------|
| **GSP Areas** | https://ukpowernetworks.opendatasoft.com/explore/dataset/ukpn-grid-supply-points/export/ | `public/data/boundaries/gsp-raw.geojson` |
| **Local Authorities** | https://ukpowernetworks.opendatasoft.com/explore/dataset/ukpn-local-authorities/export/ | `public/data/boundaries/la-raw.geojson` |
| **License Area** | https://ukpowernetworks.opendatasoft.com/explore/dataset/uk-power-networks-boundary/export/ | `public/data/boundaries/resp-raw.geojson` |

### Step 2: Transform the Data

Run the transformation script to convert UKPN field names to PowerMap format:

```bash
node scripts/transform-ukpn-boundaries.js
```

This will create properly formatted files:
- `public/data/boundaries/gsp.geojson`
- `public/data/boundaries/la.geojson`
- `public/data/boundaries/resp.geojson`

### Step 3: Test the Boundaries

1. Run `npm run dev`
2. Click the **Boundaries** dropdown (top-left of map)
3. Select each boundary type to verify they display correctly

---

## 2. Investigate Open Infrastructure Map (OIM)

The OIM layer (power lines, substations from OpenStreetMap) may not be loading.

### Diagnosis Steps:

1. Open browser DevTools (F12) → Network tab
2. Load the app and look for requests to `openinframap.org`
3. Check for:
   - **403/404 errors**: OIM service may be blocking or down
   - **CORS errors**: May need a proxy solution
   - **No requests**: Check if `addOIMToMap()` is being called

### Possible Fixes:

- **If CORS blocked**: Consider using a tile proxy or self-hosting OIM tiles
- **If service down**: OIM is a volunteer project; may have intermittent outages
- **If not loading**: Check `src/lib/oim.ts` and `src/components/map/Map.tsx:80`

---

## 3. Add UKPN ODP API Key (Optional)

If you have a UKPN Open Data Portal API key for higher rate limits:

1. Create `.env.local` file:
```bash
cp .env.example .env.local
```

2. Add your API key:
```
UKPN_ODP_API_KEY=your_api_key_here
```

---

## 4. Consider Additional Tour Content

The current tour ("Barking Grid Reinforcement 2028") could be expanded:

- Add more tours covering different regions/projects
- Add real investment data from UKPN's published plans
- Create thumbnails for each new tour (see `public/data/tours/thumbnails/`)

---

## Completed Items (for reference)

- [x] Orange color scheme implemented
- [x] "Explore Tours" button made prominent with animation
- [x] All "UK Power Networks" / "UKPN" references removed from UI
- [x] Tour thumbnail updated with pylon imagery
- [x] Transformation script created for UKPN boundary data
- [x] All tests passing (206 tests)

---

*Last updated: 2026-01-31*
