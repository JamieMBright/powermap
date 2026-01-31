#!/usr/bin/env node
/**
 * Generate comprehensive fake investment data for PowerMap.
 * Creates ~300-500 geo-positioned assets with investment data across UKPN territory.
 *
 * Usage: node scripts/generate-investment-data.js [--count=300]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BOUNDARIES_DIR = path.join(__dirname, '../public/data/boundaries');
const OUTPUT_INVESTMENTS_PATH = path.join(__dirname, '../public/data/investments.json');
const OUTPUT_ASSETS_DIR = path.join(__dirname, '../public/data/assets');

// Asset types
const ASSET_TYPES = ['substation', 'transformer', 'cable', 'overhead_line', 'switchgear'];

// Voltage levels in volts
const VOLTAGE_LEVELS = [11000, 33000, 132000, 275000];

// Investment drivers
const INVESTMENT_DRIVERS = [
  'asset_replacement',
  'load_reinforcement',
  'proactive_investment',
  'fault_level',
  'reverse_power_flow',
  'connections',
];

// Years to generate data for
const START_YEAR = 2025;
const END_YEAR = 2050;

// UKPN coverage areas with realistic geographic boundaries
// East (EPN), London (LPN), South (SPN)
const UKPN_REGIONS = {
  EPN: {
    name: 'Eastern Power Networks',
    bounds: { minLng: -0.5, maxLng: 1.8, minLat: 51.4, maxLat: 52.7 },
    weight: 0.35, // Proportion of assets
    urbanCenters: [
      { name: 'Cambridge', lng: 0.1218, lat: 52.2053, radius: 0.15, density: 3 },
      { name: 'Norwich', lng: 1.2923, lat: 52.6297, radius: 0.12, density: 2.5 },
      { name: 'Ipswich', lng: 1.1534, lat: 52.0567, radius: 0.1, density: 2 },
      { name: 'Colchester', lng: 0.9004, lat: 51.8891, radius: 0.08, density: 2 },
      { name: 'Peterborough', lng: -0.2405, lat: 52.5695, radius: 0.1, density: 2 },
      { name: 'Harlow', lng: 0.1080, lat: 51.7734, radius: 0.06, density: 1.5 },
      { name: 'Chelmsford', lng: 0.4724, lat: 51.7356, radius: 0.08, density: 2 },
    ],
  },
  LPN: {
    name: 'London Power Networks',
    bounds: { minLng: -0.5, maxLng: 0.3, minLat: 51.3, maxLat: 51.7 },
    weight: 0.35, // Higher density in London
    urbanCenters: [
      { name: 'Central London', lng: -0.1276, lat: 51.5074, radius: 0.1, density: 8 },
      { name: 'Canary Wharf', lng: -0.0235, lat: 51.5054, radius: 0.05, density: 6 },
      { name: 'Stratford', lng: -0.0027, lat: 51.5430, radius: 0.05, density: 4 },
      { name: 'Croydon', lng: -0.0988, lat: 51.3727, radius: 0.06, density: 3 },
      { name: 'Barking', lng: 0.0793, lat: 51.5397, radius: 0.04, density: 3 },
      { name: 'Greenwich', lng: 0.0098, lat: 51.4826, radius: 0.04, density: 3 },
      { name: 'Lewisham', lng: -0.0134, lat: 51.4535, radius: 0.04, density: 2.5 },
    ],
  },
  SPN: {
    name: 'South Eastern Power Networks',
    bounds: { minLng: -1.2, maxLng: 1.5, minLat: 50.7, maxLat: 51.5 },
    weight: 0.30,
    urbanCenters: [
      { name: 'Brighton', lng: -0.1372, lat: 50.8225, radius: 0.08, density: 3 },
      { name: 'Maidstone', lng: 0.5217, lat: 51.2720, radius: 0.06, density: 2 },
      { name: 'Canterbury', lng: 1.0803, lat: 51.2787, radius: 0.06, density: 2 },
      { name: 'Dover', lng: 1.3134, lat: 51.1279, radius: 0.05, density: 1.5 },
      { name: 'Guildford', lng: -0.5733, lat: 51.2362, radius: 0.06, density: 2 },
      { name: 'Reading', lng: -0.9784, lat: 51.4545, radius: 0.1, density: 2.5 },
      { name: 'Crawley', lng: -0.1870, lat: 51.1092, radius: 0.05, density: 2 },
      { name: 'Ashford', lng: 0.8748, lat: 51.1471, radius: 0.05, density: 1.5 },
    ],
  },
};

// Major substations (named assets at higher voltages)
const MAJOR_SUBSTATIONS = [
  { name: 'Barking Grid', region: 'LPN', lng: 0.0793, lat: 51.5397, voltage: 275000 },
  { name: 'City Road Primary', region: 'LPN', lng: -0.0922, lat: 51.5155, voltage: 132000 },
  { name: 'West Ham Primary', region: 'LPN', lng: 0.0050, lat: 51.5280, voltage: 132000 },
  { name: 'New Cross Primary', region: 'LPN', lng: -0.0390, lat: 51.4745, voltage: 132000 },
  { name: 'Bankside', region: 'LPN', lng: -0.0988, lat: 51.5064, voltage: 132000 },
  { name: 'Wimbledon Grid', region: 'LPN', lng: -0.1985, lat: 51.4214, voltage: 132000 },
  { name: 'Croydon Grid', region: 'LPN', lng: -0.0988, lat: 51.3727, voltage: 275000 },
  { name: 'Norwich Main', region: 'EPN', lng: 1.2923, lat: 52.6297, voltage: 275000 },
  { name: 'Cambridge Grid', region: 'EPN', lng: 0.1218, lat: 52.2053, voltage: 132000 },
  { name: 'Ipswich Grid', region: 'EPN', lng: 1.1534, lat: 52.0567, voltage: 132000 },
  { name: 'Colchester Primary', region: 'EPN', lng: 0.9004, lat: 51.8891, voltage: 132000 },
  { name: 'Peterborough Grid', region: 'EPN', lng: -0.2405, lat: 52.5695, voltage: 132000 },
  { name: 'Brighton Grid', region: 'SPN', lng: -0.1372, lat: 50.8225, voltage: 132000 },
  { name: 'Canterbury Primary', region: 'SPN', lng: 1.0803, lat: 51.2787, voltage: 132000 },
  { name: 'Reading Grid', region: 'SPN', lng: -0.9784, lat: 51.4545, voltage: 275000 },
  { name: 'Maidstone Primary', region: 'SPN', lng: 0.5217, lat: 51.2720, voltage: 132000 },
  { name: 'Guildford Grid', region: 'SPN', lng: -0.5733, lat: 51.2362, voltage: 132000 },
  { name: 'Ashford Primary', region: 'SPN', lng: 0.8748, lat: 51.1471, voltage: 132000 },
];

/**
 * Seeded random number generator for reproducibility
 */
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  pick(array) {
    return array[this.int(0, array.length - 1)];
  }

  gaussian(mean = 0, stdDev = 1) {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

const rng = new SeededRandom(42);

/**
 * Generate a random point near an urban center
 */
function generatePointNearCenter(center, rng) {
  const angle = rng.next() * 2 * Math.PI;
  const distance = rng.next() * center.radius;
  return {
    lng: center.lng + distance * Math.cos(angle),
    lat: center.lat + distance * Math.sin(angle) * 0.7, // Account for lat/lng ratio
  };
}

/**
 * Generate a random point within region bounds
 */
function generatePointInRegion(region, rng) {
  // 70% chance to be near an urban center
  if (rng.next() < 0.7) {
    // Weight centers by density
    const totalDensity = region.urbanCenters.reduce((sum, c) => sum + c.density, 0);
    let pick = rng.next() * totalDensity;
    for (const center of region.urbanCenters) {
      pick -= center.density;
      if (pick <= 0) {
        return generatePointNearCenter(center, rng);
      }
    }
  }

  // Otherwise random within bounds
  return {
    lng: rng.range(region.bounds.minLng, region.bounds.maxLng),
    lat: rng.range(region.bounds.minLat, region.bounds.maxLat),
  };
}

/**
 * Determine asset type based on voltage and random factors
 */
function determineAssetType(voltage, rng) {
  if (voltage >= 132000) {
    // High voltage: mostly substations
    const r = rng.next();
    if (r < 0.6) return 'substation';
    if (r < 0.85) return 'transformer';
    return 'switchgear';
  } else if (voltage >= 33000) {
    // Medium voltage: mix
    const r = rng.next();
    if (r < 0.3) return 'substation';
    if (r < 0.5) return 'transformer';
    if (r < 0.7) return 'cable';
    if (r < 0.9) return 'overhead_line';
    return 'switchgear';
  } else {
    // Low voltage: more diverse
    const r = rng.next();
    if (r < 0.15) return 'substation';
    if (r < 0.35) return 'transformer';
    if (r < 0.55) return 'cable';
    if (r < 0.75) return 'overhead_line';
    return 'switchgear';
  }
}

/**
 * Generate investment pattern for a single year
 */
function generateYearInvestment(year, assetType, voltage, isUrban, rng) {
  // Base investment amount based on voltage and asset type
  let baseAmount;
  if (voltage >= 275000) {
    baseAmount = rng.range(5000000, 50000000);
  } else if (voltage >= 132000) {
    baseAmount = rng.range(1000000, 20000000);
  } else if (voltage >= 33000) {
    baseAmount = rng.range(200000, 5000000);
  } else {
    baseAmount = rng.range(50000, 1000000);
  }

  // Adjust for asset type
  const typeMultipliers = {
    substation: 2.0,
    transformer: 1.2,
    cable: 1.5,
    overhead_line: 0.8,
    switchgear: 0.6,
  };
  baseAmount *= typeMultipliers[assetType];

  // Urban areas get more investment
  if (isUrban) {
    baseAmount *= rng.range(1.2, 1.8);
  }

  // Year-based growth trend (Net Zero ramp-up)
  const yearsSince2025 = year - 2025;
  const growthFactor = 1 + (yearsSince2025 * 0.03); // ~3% annual growth

  // Investment peaks
  if (year >= 2030 && year <= 2035) {
    baseAmount *= rng.range(1.1, 1.3); // ED2/ED3 transition
  }
  if (year >= 2040 && year <= 2045) {
    baseAmount *= rng.range(1.15, 1.35); // Major decarbonization push
  }

  baseAmount *= growthFactor;

  // Some years have no investment (maintenance cycles)
  if (rng.next() < 0.3) {
    return null;
  }

  // Determine primary driver based on year and asset age
  let driver;
  const driverRoll = rng.next();

  if (year < 2030) {
    // Early years: more asset replacement
    if (driverRoll < 0.35) driver = 'asset_replacement';
    else if (driverRoll < 0.55) driver = 'load_reinforcement';
    else if (driverRoll < 0.70) driver = 'proactive_investment';
    else if (driverRoll < 0.80) driver = 'fault_level';
    else if (driverRoll < 0.90) driver = 'reverse_power_flow';
    else driver = 'connections';
  } else if (year < 2040) {
    // Mid period: more load reinforcement and connections
    if (driverRoll < 0.25) driver = 'asset_replacement';
    else if (driverRoll < 0.50) driver = 'load_reinforcement';
    else if (driverRoll < 0.65) driver = 'connections';
    else if (driverRoll < 0.75) driver = 'proactive_investment';
    else if (driverRoll < 0.85) driver = 'reverse_power_flow';
    else driver = 'fault_level';
  } else {
    // Later years: heavy on connections and reverse power flow (EVs, solar)
    if (driverRoll < 0.20) driver = 'asset_replacement';
    else if (driverRoll < 0.40) driver = 'load_reinforcement';
    else if (driverRoll < 0.60) driver = 'connections';
    else if (driverRoll < 0.75) driver = 'reverse_power_flow';
    else if (driverRoll < 0.88) driver = 'proactive_investment';
    else driver = 'fault_level';
  }

  // Generate driver breakdown
  const total = Math.round(baseAmount / 1000) * 1000;
  const byDriver = {};

  // Primary driver gets 40-70% of investment
  const primaryShare = rng.range(0.4, 0.7);
  byDriver[driver] = Math.round(total * primaryShare);

  // Distribute remainder among 1-3 other drivers
  let remaining = total - byDriver[driver];
  const otherDrivers = INVESTMENT_DRIVERS.filter(d => d !== driver);
  const numOthers = rng.int(1, 3);

  for (let i = 0; i < numOthers && remaining > 0; i++) {
    const otherDriver = rng.pick(otherDrivers.filter(d => !byDriver[d]));
    if (!otherDriver) break;

    const share = i === numOthers - 1 ? remaining : Math.round(remaining * rng.range(0.3, 0.7));
    byDriver[otherDriver] = share;
    remaining -= share;
  }

  return { total, byDriver };
}

/**
 * Generate complete investment data for an asset
 */
function generateAssetInvestments(assetType, voltage, isUrban, rng) {
  const investmentsByYear = {};

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const yearData = generateYearInvestment(year, assetType, voltage, isUrban, rng);
    if (yearData) {
      investmentsByYear[year] = yearData;
    }
  }

  return investmentsByYear;
}

/**
 * Determine which boundary codes an asset falls into
 * (Simplified - assigns based on region and random distribution)
 */
function assignBoundaries(regionCode, point, rng) {
  const respCode = `RESP-${regionCode}`;

  // Generate pseudo-consistent GSP/LA/LSOA codes based on location
  const gridX = Math.floor((point.lng + 2) * 10);
  const gridY = Math.floor((point.lat - 50) * 10);

  return {
    resp: respCode,
    gsp: `GSP-${gridX}-${gridY}`,
    la: `LA-${regionCode}-${gridX % 5}`,
    lsoa: `LSOA-${regionCode}-${gridX}-${gridY}`,
  };
}

/**
 * Check if point is near an urban center
 */
function isNearUrbanCenter(point, region) {
  for (const center of region.urbanCenters) {
    const dist = Math.sqrt(
      Math.pow(point.lng - center.lng, 2) +
      Math.pow((point.lat - center.lat) * 1.4, 2) // Account for lat/lng ratio
    );
    if (dist < center.radius) {
      return true;
    }
  }
  return false;
}

/**
 * Generate all assets
 */
function generateAssets(targetCount = 350) {
  console.log(`Generating ${targetCount} assets...`);

  const assets = [];
  let assetId = 1;

  // First, add major substations
  console.log('Adding major substations...');
  for (const substation of MAJOR_SUBSTATIONS) {
    const region = UKPN_REGIONS[substation.region];
    const point = { lng: substation.lng, lat: substation.lat };
    const boundaries = assignBoundaries(substation.region, point, rng);

    assets.push({
      id: `asset-${String(assetId++).padStart(4, '0')}`,
      coordinates: [substation.lng, substation.lat],
      assetType: 'substation',
      voltage: substation.voltage,
      name: substation.name,
      region: substation.region,
      boundaries,
      investmentsByYear: generateAssetInvestments('substation', substation.voltage, true, rng),
    });
  }

  console.log(`Added ${MAJOR_SUBSTATIONS.length} major substations`);

  // Generate remaining assets distributed across regions
  const remainingCount = targetCount - MAJOR_SUBSTATIONS.length;
  const regionCounts = {};

  for (const [regionCode, region] of Object.entries(UKPN_REGIONS)) {
    regionCounts[regionCode] = Math.round(remainingCount * region.weight);
  }

  for (const [regionCode, region] of Object.entries(UKPN_REGIONS)) {
    const count = regionCounts[regionCode];
    console.log(`Generating ${count} assets for ${region.name}...`);

    for (let i = 0; i < count; i++) {
      const point = generatePointInRegion(region, rng);
      const isUrban = isNearUrbanCenter(point, region);

      // Higher voltage assets more likely near urban centers
      let voltage;
      if (isUrban && rng.next() < 0.3) {
        voltage = rng.pick([33000, 132000]);
      } else {
        voltage = rng.pick([11000, 11000, 11000, 33000, 33000]); // Weight toward 11kV
      }

      const assetType = determineAssetType(voltage, rng);
      const boundaries = assignBoundaries(regionCode, point, rng);

      const asset = {
        id: `asset-${String(assetId++).padStart(4, '0')}`,
        coordinates: [parseFloat(point.lng.toFixed(6)), parseFloat(point.lat.toFixed(6))],
        assetType,
        voltage,
        region: regionCode,
        boundaries,
        investmentsByYear: generateAssetInvestments(assetType, voltage, isUrban, rng),
      };

      // Add name for larger assets
      if (voltage >= 33000 && rng.next() < 0.5) {
        const nearestCenter = region.urbanCenters.find(c => {
          const dist = Math.sqrt(
            Math.pow(point.lng - c.lng, 2) +
            Math.pow((point.lat - c.lat) * 1.4, 2)
          );
          return dist < c.radius * 2;
        });

        if (nearestCenter) {
          const typeName = assetType === 'substation' ? 'Primary' :
                          assetType === 'transformer' ? 'Grid Transformer' :
                          assetType === 'cable' ? 'Cable Route' :
                          assetType === 'overhead_line' ? 'OHL Section' : 'RMU';
          asset.name = `${nearestCenter.name} ${typeName} ${rng.int(1, 9)}`;
        }
      }

      assets.push(asset);
    }
  }

  return assets;
}

/**
 * Convert asset data to the format expected by useInvestmentData hook
 */
function convertToYearlyFormat(assets) {
  const yearlyData = {};

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    yearlyData[year] = {
      year,
      investments: [],
    };
  }

  for (const asset of assets) {
    for (const [yearStr, investment] of Object.entries(asset.investmentsByYear)) {
      const year = parseInt(yearStr);

      // Find primary driver (the one with highest amount)
      let primaryDriver = 'asset_replacement';
      let maxAmount = 0;
      for (const [driver, amount] of Object.entries(investment.byDriver)) {
        if (amount > maxAmount) {
          maxAmount = amount;
          primaryDriver = driver;
        }
      }

      yearlyData[year].investments.push({
        id: `INV-${year}-${asset.id}`,
        year,
        location: {
          lat: asset.coordinates[1],
          lng: asset.coordinates[0],
        },
        boundaries: asset.boundaries,
        investment: {
          amount: investment.total,
          driver: primaryDriver,
          type: asset.assetType,
        },
        metadata: {
          projectName: asset.name ? `${asset.name} Investment` : undefined,
          assetId: asset.id,
        },
      });
    }
  }

  return yearlyData;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(assets) {
  const summary = {
    totalAssets: assets.length,
    byRegion: {},
    byAssetType: {},
    byVoltage: {},
    totalInvestmentByYear: {},
    totalInvestmentByDriver: {},
  };

  for (const asset of assets) {
    // Count by region
    summary.byRegion[asset.region] = (summary.byRegion[asset.region] || 0) + 1;

    // Count by type
    summary.byAssetType[asset.assetType] = (summary.byAssetType[asset.assetType] || 0) + 1;

    // Count by voltage
    summary.byVoltage[asset.voltage] = (summary.byVoltage[asset.voltage] || 0) + 1;

    // Sum investments
    for (const [year, investment] of Object.entries(asset.investmentsByYear)) {
      summary.totalInvestmentByYear[year] = (summary.totalInvestmentByYear[year] || 0) + investment.total;

      for (const [driver, amount] of Object.entries(investment.byDriver)) {
        summary.totalInvestmentByDriver[driver] = (summary.totalInvestmentByDriver[driver] || 0) + amount;
      }
    }
  }

  return summary;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  let assetCount = 350;

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      assetCount = parseInt(arg.split('=')[1]) || 350;
    }
  }

  console.log('========================================');
  console.log('PowerMap Investment Data Generator');
  console.log('========================================\n');

  // Generate assets
  const assets = generateAssets(assetCount);

  // Calculate summary
  const summary = calculateSummary(assets);

  // Create investments.json
  const investmentsData = {
    metadata: {
      generated: new Date().toISOString(),
      description: 'Fake geo-positioned investment data for PowerMap development',
      totalAssets: assets.length,
      years: { start: START_YEAR, end: END_YEAR },
      currency: 'GBP',
      note: 'Values are illustrative only and do not represent actual UKPN investment plans',
    },
    summary,
    assets,
  };

  // Write investments.json
  fs.writeFileSync(OUTPUT_INVESTMENTS_PATH, JSON.stringify(investmentsData, null, 2));
  console.log(`\nWritten: ${OUTPUT_INVESTMENTS_PATH}`);

  // Create yearly data files for the hooks
  const yearlyData = convertToYearlyFormat(assets);

  // Ensure assets directory exists
  if (!fs.existsSync(OUTPUT_ASSETS_DIR)) {
    fs.mkdirSync(OUTPUT_ASSETS_DIR, { recursive: true });
  }

  // Write yearly files (for key years used by the slider)
  const keyYears = [2025, 2030, 2035, 2040, 2045, 2050];
  for (const year of keyYears) {
    const yearPath = path.join(OUTPUT_ASSETS_DIR, `${year}.json`);
    fs.writeFileSync(yearPath, JSON.stringify(yearlyData[year], null, 2));
    console.log(`Written: ${yearPath} (${yearlyData[year].investments.length} investments)`);
  }

  // Print summary
  console.log('\n========================================');
  console.log('Generation Summary');
  console.log('========================================');
  console.log(`Total assets: ${summary.totalAssets}`);
  console.log('\nBy Region:');
  for (const [region, count] of Object.entries(summary.byRegion)) {
    console.log(`  ${region}: ${count}`);
  }
  console.log('\nBy Asset Type:');
  for (const [type, count] of Object.entries(summary.byAssetType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('\nBy Voltage:');
  for (const [voltage, count] of Object.entries(summary.byVoltage)) {
    console.log(`  ${voltage}V: ${count}`);
  }

  const totalInvestment = Object.values(summary.totalInvestmentByYear).reduce((a, b) => a + b, 0);
  console.log(`\nTotal Investment (all years): ${(totalInvestment / 1e9).toFixed(2)} billion GBP`);

  console.log('\nDone!');
}

main();
