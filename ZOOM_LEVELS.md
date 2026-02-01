# PowerMap Zoom Level Strategy

This document defines the zoom level visibility plan for all map features in PowerMap,
ensuring consistent appearance from global view (zoom 0) to street-level detail (zoom 18).

## Zoom Level Bands

| Band | Zoom Range | View Scale | Use Case |
|------|------------|------------|----------|
| **Global** | 0-3 | Continent/Country | Context, country outlines |
| **Regional** | 4-7 | Region/County | Strategic planning view |
| **Local** | 8-11 | Town/District | Investment planning |
| **Street** | 12-15 | Neighborhood | Infrastructure detail |
| **Detail** | 16-18 | Building | Asset-level inspection |

---

## Color Palette (Consistent Across All Zoom Levels)

### Base Map Colors
| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Ocean/Water | Light Blue | `#a8c8e8` | Consistent 0-18 |
| Land | Off-White | `#f8f9fa` | Consistent 4-18 |
| Grass | Light Green | `#e8f0e8` | Subtle, 60% opacity |
| Forest/Wood | Muted Green | `#dce8dc` | Subtle, 50% opacity |
| Buildings | Pale Cream | `#fef9e7` | 70% opacity |

### Road Colors (Gray Scale - Darker = More Important)
| Road Type | Color | Hex |
|-----------|-------|-----|
| Motorway/Trunk | Slate Gray | `#94a3b8` |
| Primary | Medium Gray | `#b8bcc2` |
| Secondary/Tertiary | Light Gray | `#c4c7cc` |
| Minor/Service | Very Light Gray | `#e5e7eb` |
| Railway | Medium Gray (dashed) | `#c4c7cc` |

### Administrative Boundary Colors
| Boundary | Line Color | Hex |
|----------|------------|-----|
| Country | Dark Gray | `#6b7280` |
| Region/County | Medium Gray | `#9ca3af` |

### Power Infrastructure Colors (Green Gradient - Darker = Higher Voltage)
| Voltage Level | Color | Hex | UK Network Role |
|---------------|-------|-----|-----------------|
| 275kV+ | Dark Green | `#14532d` | National Grid transmission |
| 132kV+ | Forest Green | `#166534` | Sub-transmission |
| 33kV+ | Medium Green | `#15803d` | Primary distribution |
| 11kV+ | Light Green | `#22c55e` | Secondary distribution |
| Unknown/LV | Pale Green | `#86efac` | Consumer supply |

### Other Infrastructure Colors
| Element | Color | Hex |
|---------|-------|-----|
| Power Plants | Stone Gray | `#78716c` |
| Transformers | Amber | `#f59e0b` |
| Wind Turbines | Sky Blue | `#0ea5e9` |
| Solar | Yellow | `#eab308` |
| Power Towers | Dark Gray | `#374151` |
| Power Poles | Medium Gray | `#6b7280` |

### UKPN Boundary Colors
| Boundary Type | Fill Color | Line Color | Hex |
|---------------|------------|------------|-----|
| RESP | Violet | Purple | `#8b5cf6` / `#7c3aed` |
| GSP | Deep Navy | Deep Navy | `#1e3a5a` |
| Local Authority | Emerald | Emerald | `#10b981` / `#059669` |
| LSOA | Amber | Amber | `#f59e0b` / `#d97706` |

---

## Feature Visibility Matrix

### Legend
- `●` = Visible
- `◐` = Partially visible / fading
- `○` = Not visible
- `L` = Labels visible

### Base Map Features

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| **Land Masses** |
| Ocean (background) | ● | ● | ● | ● | ● |
| Raster basemap | ● | ◐ | ○ | ○ | ○ |
| Vector land | ○ | ● | ● | ● | ● |
| Water bodies | ○ | ● | ● | ● | ● |
| **Green Spaces** |
| Grass areas | ● | ● | ● | ● | ● |
| Forests/Woodland | ● | ● | ● | ● | ● |
| **Buildings** |
| Building footprints | ○ | ○ | ○ | ● | ● |

### Road Infrastructure

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| Motorways/Trunk | ○→● | ● | ● | ● | ● |
| Primary roads | ○ | ● | ● | ● | ● |
| Secondary roads | ○ | ●(6+) | ● | ● | ● |
| Minor roads | ○ | ○ | ● | ● | ● |
| Railways | ○ | ○ | ● | ● | ● |
| Road labels | ○ | ○ | ● | ● | ● |

### Administrative Boundaries

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| Country borders | ● | ● | ● | ● | ● |
| Region borders | ○ | ● | ● | ● | ● |

### Place Labels

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| Country names | ● | ○ | ○ | ○ | ○ |
| Large cities | ● | ● | ● | ○ | ○ |
| Towns | ○ | ● | ● | ● | ○ |
| Villages | ○ | ○ | ● | ● | ● |

### Power Infrastructure (OIM)

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| **High Voltage (132kV+)** |
| Transmission lines | ●(2+) | ● | ● | ● | ● |
| Major substations | ○ | ●(5+) | ● | ● | ● |
| Power plants | ○ | ●(6+) | ● | ● | ● |
| Power plant labels | ○ | ○ | ● | ● | ● |
| **Medium Voltage (11-33kV)** |
| Distribution lines | ●(2+) | ● | ● | ● | ● |
| Substations | ○ | ●(5+) | ● | ● | ● |
| Substation labels | ○ | ○ | ● | ● | ● |
| **Low Voltage** |
| Power towers | ○ | ○ | ○ | ● | ● |
| Power poles | ○ | ○ | ○ | ○→● | ● |
| Transformers | ○ | ○ | ○ | ● | ● |
| **Generation** |
| Wind turbines | ○ | ○ | ● | ● | ● |
| Solar installations | ○ | ○ | ● | ● | ● |

### UKPN Boundaries

| Feature | 0-3 | 4-7 | 8-11 | 12-15 | 16-18 |
|---------|-----|-----|------|-------|-------|
| RESP boundaries | ●(2+) | ● | ● | ● | ● |
| RESP labels | ○ | ●(5+) | ● | ● | ● |
| GSP boundaries | ●(2+) | ● | ● | ● | ● |
| GSP labels | ○ | ●(7+) | ● | ● | ● |
| LA boundaries | ●(2+) | ● | ● | ● | ● |
| LA labels | ○ | ○ | ●(9+) | ● | ● |
| LSOA boundaries | ○ | ○ | ● | ● | ● |
| LSOA labels | ○ | ○ | ●(11+) | ● | ● |

---

## Detailed Zoom Level Specifications

### Zoom 0-3 (Global View)
**Purpose:** Provide continental/country context

| Layer | minZoom | maxZoom | Notes |
|-------|---------|---------|-------|
| background | 0 | - | Ocean blue `#a8c8e8` |
| natural-earth-raster | 0 | 6 | Fades 5→6 |
| landcover-grass | 0 | - | Subtle green |
| landcover-wood | 0 | - | Subtle green |
| boundary-country | 0 | - | Dashed gray |
| place-country | 0 | 6 | UPPERCASE labels |
| place-city | 3 | 14 | Major cities only |
| road-motorway | 2 | - | Thin lines |
| oim-power-line | 2 | - | HV transmission |
| boundary-resp | 2 | - | UKPN regions |
| boundary-gsp | 2 | - | Grid supply points |
| boundary-la | 2 | - | Local authorities |

### Zoom 4-7 (Regional View)
**Purpose:** Strategic planning, regional investment overview

| Layer | minZoom | maxZoom | Notes |
|-------|---------|---------|-------|
| land | 4 | - | Vector takes over |
| water | 4 | - | Vector water |
| road-primary | 4 | - | A-roads appear |
| road-secondary | 6 | - | B-roads appear |
| boundary-region | 4 | - | County borders |
| oim-substation | 5 | - | Substations appear |
| oim-power-plant | 6 | - | Power stations |
| place-town | 6 | 15 | Town labels |
| boundary-resp-label | 5 | - | RESP names |
| boundary-gsp-label | 7 | - | GSP names |

### Zoom 8-11 (Local View)
**Purpose:** Investment planning, infrastructure assessment

| Layer | minZoom | maxZoom | Notes |
|-------|---------|---------|-------|
| railway | 8 | - | Rail lines |
| oim-wind-turbine | 8 | - | Wind generation |
| oim-power-plant-label | 8 | - | Plant names |
| boundary-lsoa | 8 | - | LSOA polygons |
| boundary-la-label | 9 | - | LA names |
| road-minor | 10 | - | Local roads |
| place-village | 10 | - | Village names |
| road-label-major | 10 | - | Road names |
| oim-substation-label | 10 | - | Substation names |
| oim-solar | 10 | - | Solar farms |
| boundary-lsoa-label | 11 | - | LSOA names |

### Zoom 12-15 (Street View)
**Purpose:** Infrastructure detail, asset inspection

| Layer | minZoom | maxZoom | Notes |
|-------|---------|---------|-------|
| oim-power-tower | 12 | - | Transmission towers |
| building | 13 | - | Building footprints |
| oim-transformer | 13 | - | Transformers |
| oim-power-pole | 14 | - | Distribution poles |

### Zoom 16-18 (Detail View)
**Purpose:** Asset-level inspection, street infrastructure

All layers visible with maximum detail. Line widths and symbol sizes
reach their maximum values.

---

## Line Width Scaling

### Roads
```
Motorway:   zoom 2→0.5px, zoom 4→1.2px, zoom 8→2.5px, zoom 12→4px, zoom 16→8px
Primary:    zoom 4→0.3px, zoom 6→0.8px, zoom 10→2px, zoom 14→4px, zoom 18→8px
Secondary:  zoom 6→0.3px, zoom 8→0.8px, zoom 12→2px, zoom 16→5px
Minor:      zoom 10→0.5px, zoom 14→2px, zoom 18→4px
```

### Power Lines
```
All voltages: zoom 2→0.5px, zoom 5→1px, zoom 10→2px, zoom 15→4px
```

### Boundaries
```
All types: minZoom→1px, minZoom+4→2px, minZoom+8→3px
```

---

## Symbol Size Scaling

### Place Labels
```
Country:  14px fixed
City:     zoom 3→9px, zoom 5→11px, zoom 10→14px
Town:     zoom 6→8px, zoom 8→10px, zoom 12→12px
Village:  10px fixed
```

### Substation Circles
```
zoom 5→2px, zoom 8→4px, zoom 12→7px, zoom 16→12px
```

### Power Towers/Poles
```
Towers: zoom 12→2px, zoom 16→5px, zoom 20→8px
Poles:  zoom 14→2px, zoom 18→4px
```

---

## Implementation Checklist

- [x] Base map colors consistent
- [x] Ocean color `#a8c8e8` throughout
- [x] Land transitions smoothly at zoom 4-6
- [x] Green space colors subtle and consistent
- [x] Road hierarchy clear through color
- [x] Power line voltage colors consistent (green gradient)
- [x] UKPN boundaries visible from zoom 2
- [x] Labels appear at appropriate zoom levels
- [x] Buildings only at zoom 13+
- [x] Detail features (poles, transformers) at high zoom

---

## Tour Zoom Recommendations

| Tour Type | Recommended Zoom Range | Pitch |
|-----------|----------------------|-------|
| National overview | 5-6 | 0° |
| Regional story | 8-10 | 0-30° |
| Investment site | 11-13 | 30-45° |
| Infrastructure detail | 14-16 | 45-60° |

---

## Smooth Transitions

All layers use smooth fade-in transitions at their minZoom threshold:

| Layer Type | Transition Range |
|------------|------------------|
| Motorways | zoom 2→3 |
| Primary roads | zoom 4→5 |
| Secondary roads | zoom 6→7 |
| Minor roads | zoom 10→11 |
| Railways | zoom 8→9 |
| Region borders | zoom 4→5 |
| Buildings | zoom 13→14 |
| Building outlines | zoom 14→15 |
| Power lines | zoom 2→3 |
| Substations | zoom 5→6 |
| Power plants | zoom 6→7 |
| Wind turbines | zoom 8→9 |
| Solar | zoom 10→11 |
| Power towers | zoom 12→13 |
| Transformers | zoom 13→14 |
| Power poles | zoom 14→15 |
| Labels | +1 zoom level fade |

---

## Performance Notes

1. **LSOA boundaries** limited to zoom 8+ due to high polygon count
2. **Power poles** limited to zoom 14+ to avoid visual clutter
3. **Raster basemap** limited to zoom 6 to reduce tile requests
4. **OIM tiles** bounded to UK for performance
5. **Labels** use `text-optional: true` to prevent collisions
6. **Smooth transitions** prevent jarring visual changes when zooming

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial zoom level strategy |
