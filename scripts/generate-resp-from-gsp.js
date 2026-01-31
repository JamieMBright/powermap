#!/usr/bin/env node
/**
 * Generate RESP (Regional Energy Strategic Planner) boundaries from GSP data
 * by aggregating GSP polygons by their DNO (Distribution Network Operator).
 *
 * DNO regions:
 * - EPN: Eastern Power Networks
 * - SPN: South Eastern Power Networks
 * - LPN: London Power Networks
 */

const fs = require('fs');
const path = require('path');

const BOUNDARIES_DIR = path.join(__dirname, '../public/data/boundaries');

// DNO name mappings
const DNO_NAMES = {
  EPN: 'Eastern Power Networks',
  SPN: 'South Eastern Power Networks',
  LPN: 'London Power Networks',
};

/**
 * Merge multiple polygons into a MultiPolygon geometry
 */
function mergeGeometries(geometries) {
  const allPolygons = [];

  for (const geometry of geometries) {
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      allPolygons.push(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      allPolygons.push(...geometry.coordinates);
    }
  }

  if (allPolygons.length === 0) {
    return null;
  }

  if (allPolygons.length === 1) {
    return {
      type: 'Polygon',
      coordinates: allPolygons[0],
    };
  }

  return {
    type: 'MultiPolygon',
    coordinates: allPolygons,
  };
}

/**
 * Generate RESP boundaries from GSP data
 */
function generateRespFromGsp() {
  const gspPath = path.join(BOUNDARIES_DIR, 'gsp.geojson');
  const respOutputPath = path.join(BOUNDARIES_DIR, 'resp.geojson');

  if (!fs.existsSync(gspPath)) {
    console.error('Error: gsp.geojson not found at', gspPath);
    process.exit(1);
  }

  console.log('Loading GSP data...');
  const gspData = JSON.parse(fs.readFileSync(gspPath, 'utf-8'));

  // Group GSPs by DNO
  const gspsByDno = {};
  let noDoFeatures = 0;

  for (const feature of gspData.features) {
    const dno = feature.properties?._original?.dno;

    if (!dno) {
      noDoFeatures++;
      continue;
    }

    if (!gspsByDno[dno]) {
      gspsByDno[dno] = [];
    }
    gspsByDno[dno].push(feature);
  }

  console.log(`Found ${Object.keys(gspsByDno).length} DNO regions:`, Object.keys(gspsByDno));
  if (noDoFeatures > 0) {
    console.log(`  (${noDoFeatures} features had no DNO assigned)`);
  }

  // Create RESP features by merging geometries for each DNO
  const respFeatures = [];

  for (const [dno, features] of Object.entries(gspsByDno)) {
    const geometries = features.map(f => f.geometry).filter(Boolean);
    const mergedGeometry = mergeGeometries(geometries);

    if (!mergedGeometry) {
      console.warn(`  Warning: Could not merge geometries for ${dno}`);
      continue;
    }

    // Get list of GSP names for reference
    const gspNames = features
      .map(f => f.properties?._original?.grid_supply_point)
      .filter(Boolean)
      .sort();

    respFeatures.push({
      type: 'Feature',
      properties: {
        code: dno,
        name: DNO_NAMES[dno] || dno,
        gsp_count: features.length,
        _original: {
          dno,
          gsp_names: gspNames,
        },
      },
      geometry: mergedGeometry,
    });

    console.log(`  ${dno}: ${features.length} GSPs merged into RESP region`);
  }

  // Sort features by code for consistency
  respFeatures.sort((a, b) => a.properties.code.localeCompare(b.properties.code));

  // Write output
  const respData = {
    type: 'FeatureCollection',
    features: respFeatures,
  };

  fs.writeFileSync(respOutputPath, JSON.stringify(respData, null, 2));
  console.log(`\nWrote ${respFeatures.length} RESP regions to ${respOutputPath}`);
}

// Run
console.log('Generate RESP Boundaries from GSP Data');
console.log('======================================\n');
generateRespFromGsp();
