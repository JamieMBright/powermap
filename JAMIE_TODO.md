# Jamie's TODO List

Items that require manual action (cannot be automated due to proxy/access restrictions).

---

## ~~1. Download Real Boundary Data from UKPN Open Data Portal~~ ✅ COMPLETED

Downloaded and transformed on 2026-01-31:
- GSP Areas: 58 features (5.6 MB)
- Local Authorities: 133 features (128 MB)
- License Area: 1 feature (938 KB)

Files created:
- `public/data/boundaries/gsp.geojson`
- `public/data/boundaries/la.geojson`
- `public/data/boundaries/resp.geojson`

**Next step**: Run `npm run dev` and test boundaries in the app

---

## 2. Debug Map Display Issues

If the map is not displaying, use the diagnostic page:

### Debug Page

Visit `/debug/map` in development to see:
- Container dimensions (should not be 0x0)
- Map initialization logs
- Error messages
- Style loading status

```bash
npm run dev
# Open http://localhost:3000/debug/map
```

### Common Issues:

1. **Container has zero dimensions**: Parent elements need explicit height
2. **Style not loading**: Check network requests to `basemaps.cartocdn.com`
3. **CORS errors**: The CARTO basemap or OIM tiles may be blocked

---

## 3. Investigate Open Infrastructure Map (OIM)

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

## ~~4. Add UKPN ODP API Key~~ ✅ COMPLETED

API key is already configured in `.env` file.

---

## 5. Consider Additional Tour Content

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
- [x] Fixed Map CSS conflict (relative + absolute position classes)
- [x] Added Map component unit tests
- [x] Added debug page at `/debug/map` for troubleshooting
- [x] Downloaded real boundary data from UKPN ODP (GSP, LA, RESP)
- [x] UKPN ODP API key configured
- [x] All tests passing (219 tests)

---

*Last updated: 2026-01-31*
