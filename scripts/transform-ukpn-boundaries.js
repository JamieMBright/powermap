#!/usr/bin/env node
/**
 * Transform UKPN Open Data Portal GeoJSON files to the format expected by PowerMap.
 *
 * Usage:
 *   1. Download GeoJSON files from UKPN ODP:
 *      - GSP: https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets/ukpn-grid-supply-points/exports/geojson
 *      - LA: https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets/ukpn-local-authorities/exports/geojson
 *      - License: https://ukpowernetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets/uk-power-networks-boundary/exports/geojson
 *
 *   2. Save them to public/data/boundaries/ as:
 *      - gsp-raw.geojson
 *      - la-raw.geojson
 *      - resp-raw.geojson
 *
 *   3. Run: node scripts/transform-ukpn-boundaries.js
 */

const fs = require('fs');
const path = require('path');

const BOUNDARIES_DIR = path.join(__dirname, '../public/data/boundaries');

// Field mappings from UKPN ODP to PowerMap format
// Adjust these based on actual UKPN dataset field names
const FIELD_MAPPINGS = {
  gsp: {
    // UKPN GSP dataset likely uses these fields
    codeFields: ['gsp_id', 'gsp_code', 'code', 'objectid', 'gsp_name_short'],
    nameFields: ['gsp_name', 'name', 'gsp_name_long', 'site_name'],
  },
  la: {
    // UKPN Local Authorities dataset
    codeFields: ['la_code', 'ons_code', 'lad_code', 'code', 'objectid'],
    nameFields: ['la_name', 'lad_name', 'name', 'local_authority_name'],
  },
  resp: {
    // UKPN License boundary
    codeFields: ['licence_area', 'area_code', 'code', 'objectid', 'name'],
    nameFields: ['licence_name', 'area_name', 'name', 'description'],
  },
};

/**
 * Find the first matching field value from a list of possible field names
 */
function findFieldValue(properties, possibleFields, defaultValue = '') {
  for (const field of possibleFields) {
    // Check exact match
    if (properties[field] !== undefined && properties[field] !== null) {
      return String(properties[field]);
    }
    // Check case-insensitive match
    const lowerField = field.toLowerCase();
    for (const [key, value] of Object.entries(properties)) {
      if (key.toLowerCase() === lowerField && value !== undefined && value !== null) {
        return String(value);
      }
    }
  }
  return defaultValue;
}

/**
 * Transform a GeoJSON FeatureCollection to PowerMap format
 */
function transformGeoJSON(geojson, boundaryType) {
  const mapping = FIELD_MAPPINGS[boundaryType];

  if (!geojson || !geojson.features) {
    console.error(`Invalid GeoJSON for ${boundaryType}`);
    return null;
  }

  // Log first feature's properties to help debug field names
  if (geojson.features.length > 0) {
    console.log(`\n${boundaryType} sample properties:`, Object.keys(geojson.features[0].properties || {}));
  }

  const transformedFeatures = geojson.features.map((feature, index) => {
    const props = feature.properties || {};

    const code = findFieldValue(props, mapping.codeFields, `${boundaryType.toUpperCase()}-${index}`);
    const name = findFieldValue(props, mapping.nameFields, `${boundaryType} Area ${index + 1}`);

    return {
      type: 'Feature',
      properties: {
        code,
        name,
        // Preserve original properties for reference
        _original: props,
      },
      geometry: feature.geometry,
    };
  });

  return {
    type: 'FeatureCollection',
    features: transformedFeatures,
  };
}

/**
 * Process a boundary file
 */
function processBoundaryFile(boundaryType) {
  const inputPath = path.join(BOUNDARIES_DIR, `${boundaryType}-raw.geojson`);
  const outputPath = path.join(BOUNDARIES_DIR, `${boundaryType}.geojson`);

  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${boundaryType}: ${inputPath} not found`);
    return false;
  }

  console.log(`Processing ${boundaryType}...`);

  try {
    const rawContent = fs.readFileSync(inputPath, 'utf-8');
    const geojson = JSON.parse(rawContent);

    const transformed = transformGeoJSON(geojson, boundaryType);

    if (transformed) {
      fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
      console.log(`  ✓ Wrote ${transformed.features.length} features to ${outputPath}`);
      return true;
    }
  } catch (err) {
    console.error(`  ✗ Error processing ${boundaryType}:`, err.message);
  }

  return false;
}

// Main execution
console.log('UKPN Boundary Transformation Script');
console.log('====================================\n');

const boundaryTypes = ['gsp', 'la', 'resp'];
let successCount = 0;

for (const type of boundaryTypes) {
  if (processBoundaryFile(type)) {
    successCount++;
  }
}

console.log(`\nCompleted: ${successCount}/${boundaryTypes.length} boundary files processed.`);

if (successCount < boundaryTypes.length) {
  console.log('\nTo download missing files, visit:');
  console.log('  GSP: https://ukpowernetworks.opendatasoft.com/explore/dataset/ukpn-grid-supply-points/export/');
  console.log('  LA:  https://ukpowernetworks.opendatasoft.com/explore/dataset/ukpn-local-authorities/export/');
  console.log('  License: https://ukpowernetworks.opendatasoft.com/explore/dataset/uk-power-networks-boundary/export/');
}
