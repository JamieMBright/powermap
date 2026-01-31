#!/usr/bin/env node
/**
 * Generate dummy investment data for testing the PowerMap application.
 * Creates investment breakdowns by area, year, and category.
 */

const fs = require('fs');
const path = require('path');

const BOUNDARIES_DIR = path.join(__dirname, '../public/data/boundaries');
const OUTPUT_PATH = path.join(__dirname, '../public/data/investment-by-area.json');

// Investment drivers matching types.ts
const INVESTMENT_DRIVERS = [
  'asset_replacement',
  'load_reinforcement',
  'proactive_investment',
  'fault_level',
  'reverse_power_flow',
  'connections',
];

// Years from 2025 to 2050
const YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);

/**
 * Generate a random investment amount within a range
 */
function randomInvestment(min, max) {
  return Math.round((Math.random() * (max - min) + min) / 1000) * 1000;
}

/**
 * Generate investment breakdown by driver for a given total budget
 * with realistic distribution patterns
 */
function generateDriverBreakdown(totalBudget, areaType) {
  // Define typical distribution patterns based on area type
  let weights;

  if (areaType === 'resp') {
    // Regional level - more balanced distribution
    weights = {
      asset_replacement: 0.30 + (Math.random() - 0.5) * 0.1,
      load_reinforcement: 0.25 + (Math.random() - 0.5) * 0.1,
      proactive_investment: 0.15 + (Math.random() - 0.5) * 0.05,
      fault_level: 0.10 + (Math.random() - 0.5) * 0.05,
      reverse_power_flow: 0.10 + (Math.random() - 0.5) * 0.05,
      connections: 0.10 + (Math.random() - 0.5) * 0.05,
    };
  } else if (areaType === 'gsp') {
    // GSP level - more variation
    weights = {
      asset_replacement: 0.28 + (Math.random() - 0.5) * 0.15,
      load_reinforcement: 0.25 + (Math.random() - 0.5) * 0.15,
      proactive_investment: 0.15 + (Math.random() - 0.5) * 0.10,
      fault_level: 0.12 + (Math.random() - 0.5) * 0.08,
      reverse_power_flow: 0.10 + (Math.random() - 0.5) * 0.08,
      connections: 0.10 + (Math.random() - 0.5) * 0.08,
    };
  } else {
    // LA level - highest variation
    weights = {
      asset_replacement: 0.25 + (Math.random() - 0.5) * 0.2,
      load_reinforcement: 0.25 + (Math.random() - 0.5) * 0.2,
      proactive_investment: 0.15 + (Math.random() - 0.5) * 0.15,
      fault_level: 0.12 + (Math.random() - 0.5) * 0.12,
      reverse_power_flow: 0.12 + (Math.random() - 0.5) * 0.12,
      connections: 0.11 + (Math.random() - 0.5) * 0.10,
    };
  }

  // Ensure no negative weights
  Object.keys(weights).forEach(key => {
    weights[key] = Math.max(0.02, weights[key]);
  });

  // Normalize weights to sum to 1
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  Object.keys(weights).forEach(key => {
    weights[key] /= totalWeight;
  });

  // Generate investment amounts
  const breakdown = {};
  let allocated = 0;

  INVESTMENT_DRIVERS.forEach((driver, index) => {
    if (index === INVESTMENT_DRIVERS.length - 1) {
      // Last driver gets remainder to ensure total matches
      breakdown[driver] = Math.max(0, totalBudget - allocated);
    } else {
      const amount = Math.round(totalBudget * weights[driver] / 1000) * 1000;
      breakdown[driver] = amount;
      allocated += amount;
    }
  });

  return breakdown;
}

/**
 * Generate yearly investment data for an area with growth trends
 */
function generateYearlyData(baseInvestment, areaType) {
  const yearlyData = {};

  YEARS.forEach((year, index) => {
    // Apply growth/variation factor based on year
    // Early years: more asset replacement
    // Later years: more load reinforcement and connections due to EV/heat pump growth
    let yearFactor = 1;

    // General growth trend (~3% per year on average)
    yearFactor *= Math.pow(1.03, index);

    // Add some year-to-year variation
    yearFactor *= 0.85 + Math.random() * 0.3;

    // Investment peaks around 2030-2035 (ED2/ED3 transition)
    if (year >= 2030 && year <= 2035) {
      yearFactor *= 1.15;
    }

    // Another peak around 2040-2045 (major decarbonization push)
    if (year >= 2040 && year <= 2045) {
      yearFactor *= 1.10;
    }

    const totalForYear = Math.round(baseInvestment * yearFactor / 1000) * 1000;
    yearlyData[year] = generateDriverBreakdown(totalForYear, areaType);
  });

  return yearlyData;
}

/**
 * Load area codes from boundary files
 */
function loadAreaCodes(boundaryType) {
  const filePath = path.join(BOUNDARIES_DIR, `${boundaryType}.geojson`);

  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filePath} not found`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.features.map(f => ({
    code: f.properties.code,
    name: f.properties.name,
  }));
}

/**
 * Main function to generate all investment data
 */
function generateInvestmentData() {
  console.log('Loading boundary area codes...');

  const respAreas = loadAreaCodes('resp');
  const gspAreas = loadAreaCodes('gsp');
  const laAreas = loadAreaCodes('la');

  console.log(`  RESP areas: ${respAreas.length}`);
  console.log(`  GSP areas: ${gspAreas.length}`);
  console.log(`  LA areas: ${laAreas.length}`);

  const investmentData = {
    metadata: {
      generated: new Date().toISOString(),
      description: 'Dummy investment data for PowerMap development and testing',
      years: { start: YEARS[0], end: YEARS[YEARS.length - 1] },
      investmentDrivers: INVESTMENT_DRIVERS,
      currency: 'GBP',
      note: 'Values are illustrative only and do not represent actual UKPN investment plans',
    },
    byArea: {},
    summary: {
      totalByYear: {},
      totalByDriver: {},
    },
  };

  // Generate RESP area data (larger investments at regional level)
  console.log('\nGenerating RESP investment data...');
  respAreas.forEach(area => {
    // Base annual investment: 200-400M for regional areas
    const baseInvestment = randomInvestment(200_000_000, 400_000_000);
    investmentData.byArea[area.code] = {
      name: area.name,
      type: 'resp',
      data: generateYearlyData(baseInvestment, 'resp'),
    };
  });

  // Generate GSP area data (medium investments)
  console.log('Generating GSP investment data...');
  gspAreas.forEach(area => {
    // Base annual investment: 10-50M for GSP areas
    const baseInvestment = randomInvestment(10_000_000, 50_000_000);
    investmentData.byArea[area.code] = {
      name: area.name,
      type: 'gsp',
      data: generateYearlyData(baseInvestment, 'gsp'),
    };
  });

  // Generate LA area data (smaller, more granular investments)
  console.log('Generating LA investment data...');
  laAreas.forEach(area => {
    // Base annual investment: 2-15M for LA areas
    const baseInvestment = randomInvestment(2_000_000, 15_000_000);
    investmentData.byArea[area.code] = {
      name: area.name,
      type: 'la',
      data: generateYearlyData(baseInvestment, 'la'),
    };
  });

  // Calculate summary totals
  console.log('\nCalculating summary totals...');

  YEARS.forEach(year => {
    investmentData.summary.totalByYear[year] = 0;
  });

  INVESTMENT_DRIVERS.forEach(driver => {
    investmentData.summary.totalByDriver[driver] = 0;
  });

  // Only sum RESP level to avoid double counting (RESP is the top level)
  Object.entries(investmentData.byArea).forEach(([code, areaData]) => {
    if (areaData.type === 'resp') {
      Object.entries(areaData.data).forEach(([year, drivers]) => {
        Object.entries(drivers).forEach(([driver, amount]) => {
          investmentData.summary.totalByYear[year] += amount;
          investmentData.summary.totalByDriver[driver] += amount;
        });
      });
    }
  });

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(investmentData, null, 2));

  // Summary statistics
  const totalInvestment = Object.values(investmentData.summary.totalByYear).reduce((sum, v) => sum + v, 0);
  const avgAnnual = totalInvestment / YEARS.length;

  console.log('\n========================================');
  console.log('Investment Data Generation Complete');
  console.log('========================================');
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Total areas: ${Object.keys(investmentData.byArea).length}`);
  console.log(`Years covered: ${YEARS[0]} - ${YEARS[YEARS.length - 1]}`);
  console.log(`Total investment (RESP level): ${(totalInvestment / 1e9).toFixed(2)}bn`);
  console.log(`Average annual: ${(avgAnnual / 1e9).toFixed(2)}bn`);
}

// Run
console.log('Dummy Investment Data Generator');
console.log('================================\n');
generateInvestmentData();
