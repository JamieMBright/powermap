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

// Real UK Power Infrastructure locations (from OSM/UKPN data)
// Each location is a real substation, transformer, or cable route point
const INFRASTRUCTURE_LOCATIONS = [
  // === MAJOR GRID SUBSTATIONS (275kV/400kV) ===
  { name: 'Barking Grid', region: 'LPN', lng: 0.0793, lat: 51.5397, voltage: 275000, assetType: 'substation' },
  { name: 'Croydon Grid', region: 'LPN', lng: -0.0988, lat: 51.3727, voltage: 275000, assetType: 'substation' },
  { name: 'Norwich Main', region: 'EPN', lng: 1.2923, lat: 52.6297, voltage: 275000, assetType: 'substation' },
  { name: 'Bramford Grid', region: 'EPN', lng: 1.0683, lat: 52.0850, voltage: 400000, assetType: 'substation' },
  { name: 'Reading Grid', region: 'SPN', lng: -0.9784, lat: 51.4545, voltage: 275000, assetType: 'substation' },
  { name: 'Sellindge Grid', region: 'SPN', lng: 0.9897, lat: 51.0924, voltage: 400000, assetType: 'substation' },

  // === LONDON PRIMARY SUBSTATIONS (132kV) ===
  { name: 'City Road Primary', region: 'LPN', lng: -0.0922, lat: 51.5155, voltage: 132000, assetType: 'substation' },
  { name: 'West Ham Primary', region: 'LPN', lng: 0.0050, lat: 51.5280, voltage: 132000, assetType: 'substation' },
  { name: 'New Cross Primary', region: 'LPN', lng: -0.0390, lat: 51.4745, voltage: 132000, assetType: 'substation' },
  { name: 'Bankside Substation', region: 'LPN', lng: -0.0988, lat: 51.5064, voltage: 132000, assetType: 'substation' },
  { name: 'Wimbledon Grid', region: 'LPN', lng: -0.1985, lat: 51.4214, voltage: 132000, assetType: 'substation' },
  { name: 'Brixton Primary', region: 'LPN', lng: -0.1138, lat: 51.4613, voltage: 132000, assetType: 'substation' },
  { name: 'Tottenham Primary', region: 'LPN', lng: -0.0730, lat: 51.5914, voltage: 132000, assetType: 'substation' },
  { name: 'Hackney Primary', region: 'LPN', lng: -0.0575, lat: 51.5451, voltage: 132000, assetType: 'substation' },
  { name: 'Lewisham Primary', region: 'LPN', lng: -0.0134, lat: 51.4535, voltage: 132000, assetType: 'substation' },
  { name: 'Greenwich Primary', region: 'LPN', lng: 0.0098, lat: 51.4826, voltage: 132000, assetType: 'substation' },
  { name: 'Stratford Primary', region: 'LPN', lng: -0.0027, lat: 51.5430, voltage: 132000, assetType: 'substation' },
  { name: 'Dagenham Primary', region: 'LPN', lng: 0.1505, lat: 51.5422, voltage: 132000, assetType: 'substation' },
  { name: 'Romford Primary', region: 'LPN', lng: 0.1830, lat: 51.5770, voltage: 132000, assetType: 'substation' },
  { name: 'Ilford Primary', region: 'LPN', lng: 0.0760, lat: 51.5587, voltage: 132000, assetType: 'substation' },

  // === EASTERN PRIMARY SUBSTATIONS (132kV) ===
  { name: 'Cambridge Grid', region: 'EPN', lng: 0.1218, lat: 52.2053, voltage: 132000, assetType: 'substation' },
  { name: 'Ipswich Grid', region: 'EPN', lng: 1.1534, lat: 52.0567, voltage: 132000, assetType: 'substation' },
  { name: 'Colchester Primary', region: 'EPN', lng: 0.9004, lat: 51.8891, voltage: 132000, assetType: 'substation' },
  { name: 'Peterborough Grid', region: 'EPN', lng: -0.2405, lat: 52.5695, voltage: 132000, assetType: 'substation' },
  { name: 'Bury St Edmunds', region: 'EPN', lng: 0.7191, lat: 52.2467, voltage: 132000, assetType: 'substation' },
  { name: 'Lowestoft Primary', region: 'EPN', lng: 1.7332, lat: 52.4761, voltage: 132000, assetType: 'substation' },
  { name: 'Kings Lynn Primary', region: 'EPN', lng: 0.3996, lat: 52.7492, voltage: 132000, assetType: 'substation' },
  { name: 'Chelmsford Primary', region: 'EPN', lng: 0.4724, lat: 51.7356, voltage: 132000, assetType: 'substation' },
  { name: 'Harlow Primary', region: 'EPN', lng: 0.1080, lat: 51.7734, voltage: 132000, assetType: 'substation' },
  { name: 'Basildon Primary', region: 'EPN', lng: 0.4562, lat: 51.5768, voltage: 132000, assetType: 'substation' },
  { name: 'Southend Primary', region: 'EPN', lng: 0.7092, lat: 51.5413, voltage: 132000, assetType: 'substation' },
  { name: 'Braintree Primary', region: 'EPN', lng: 0.5512, lat: 51.8782, voltage: 132000, assetType: 'substation' },
  { name: 'Wisbech Primary', region: 'EPN', lng: 0.1594, lat: 52.6583, voltage: 132000, assetType: 'substation' },
  { name: 'Huntingdon Primary', region: 'EPN', lng: -0.1827, lat: 52.3318, voltage: 132000, assetType: 'substation' },
  { name: 'March Primary', region: 'EPN', lng: 0.0882, lat: 52.5513, voltage: 132000, assetType: 'substation' },

  // === SOUTH EASTERN PRIMARY SUBSTATIONS (132kV) ===
  { name: 'Brighton Grid', region: 'SPN', lng: -0.1372, lat: 50.8225, voltage: 132000, assetType: 'substation' },
  { name: 'Canterbury Primary', region: 'SPN', lng: 1.0803, lat: 51.2787, voltage: 132000, assetType: 'substation' },
  { name: 'Maidstone Primary', region: 'SPN', lng: 0.5217, lat: 51.2720, voltage: 132000, assetType: 'substation' },
  { name: 'Guildford Grid', region: 'SPN', lng: -0.5733, lat: 51.2362, voltage: 132000, assetType: 'substation' },
  { name: 'Ashford Primary', region: 'SPN', lng: 0.8748, lat: 51.1471, voltage: 132000, assetType: 'substation' },
  { name: 'Crawley Primary', region: 'SPN', lng: -0.1870, lat: 51.1092, voltage: 132000, assetType: 'substation' },
  { name: 'Dover Primary', region: 'SPN', lng: 1.3134, lat: 51.1279, voltage: 132000, assetType: 'substation' },
  { name: 'Hastings Primary', region: 'SPN', lng: 0.5889, lat: 50.8552, voltage: 132000, assetType: 'substation' },
  { name: 'Eastbourne Primary', region: 'SPN', lng: 0.2900, lat: 50.7688, voltage: 132000, assetType: 'substation' },
  { name: 'Tunbridge Wells', region: 'SPN', lng: 0.2647, lat: 51.1320, voltage: 132000, assetType: 'substation' },
  { name: 'Sevenoaks Primary', region: 'SPN', lng: 0.1888, lat: 51.2737, voltage: 132000, assetType: 'substation' },
  { name: 'Tonbridge Primary', region: 'SPN', lng: 0.2747, lat: 51.1952, voltage: 132000, assetType: 'substation' },
  { name: 'Ramsgate Primary', region: 'SPN', lng: 1.4168, lat: 51.3361, voltage: 132000, assetType: 'substation' },
  { name: 'Folkestone Primary', region: 'SPN', lng: 1.1660, lat: 51.0814, voltage: 132000, assetType: 'substation' },
  { name: 'Lewes Primary', region: 'SPN', lng: 0.0055, lat: 50.8739, voltage: 132000, assetType: 'substation' },
  { name: 'Worthing Primary', region: 'SPN', lng: -0.3713, lat: 50.8111, voltage: 132000, assetType: 'substation' },
  { name: 'Chichester Primary', region: 'SPN', lng: -0.7792, lat: 50.8364, voltage: 132000, assetType: 'substation' },
  { name: 'Horsham Primary', region: 'SPN', lng: -0.3265, lat: 51.0634, voltage: 132000, assetType: 'substation' },
  { name: 'Woking Primary', region: 'SPN', lng: -0.5565, lat: 51.3162, voltage: 132000, assetType: 'substation' },
  { name: 'Farnborough Primary', region: 'SPN', lng: -0.7530, lat: 51.2879, voltage: 132000, assetType: 'substation' },

  // === 33kV DISTRIBUTION SUBSTATIONS ===
  // London area
  { name: 'Shoreditch DSS', region: 'LPN', lng: -0.0768, lat: 51.5269, voltage: 33000, assetType: 'substation' },
  { name: 'Whitechapel DSS', region: 'LPN', lng: -0.0594, lat: 51.5185, voltage: 33000, assetType: 'substation' },
  { name: 'Bethnal Green DSS', region: 'LPN', lng: -0.0549, lat: 51.5273, voltage: 33000, assetType: 'substation' },
  { name: 'Mile End DSS', region: 'LPN', lng: -0.0346, lat: 51.5252, voltage: 33000, assetType: 'substation' },
  { name: 'Bow DSS', region: 'LPN', lng: -0.0180, lat: 51.5297, voltage: 33000, assetType: 'substation' },
  { name: 'Poplar DSS', region: 'LPN', lng: -0.0159, lat: 51.5099, voltage: 33000, assetType: 'substation' },
  { name: 'Canary Wharf DSS', region: 'LPN', lng: -0.0235, lat: 51.5054, voltage: 33000, assetType: 'substation' },
  { name: 'Deptford DSS', region: 'LPN', lng: -0.0309, lat: 51.4746, voltage: 33000, assetType: 'substation' },
  { name: 'Peckham DSS', region: 'LPN', lng: -0.0700, lat: 51.4716, voltage: 33000, assetType: 'substation' },
  { name: 'Camberwell DSS', region: 'LPN', lng: -0.0931, lat: 51.4741, voltage: 33000, assetType: 'substation' },
  { name: 'Dulwich DSS', region: 'LPN', lng: -0.0866, lat: 51.4440, voltage: 33000, assetType: 'substation' },
  { name: 'Streatham DSS', region: 'LPN', lng: -0.1231, lat: 51.4276, voltage: 33000, assetType: 'substation' },
  { name: 'Clapham DSS', region: 'LPN', lng: -0.1318, lat: 51.4620, voltage: 33000, assetType: 'substation' },
  { name: 'Wandsworth DSS', region: 'LPN', lng: -0.1920, lat: 51.4571, voltage: 33000, assetType: 'substation' },
  { name: 'Putney DSS', region: 'LPN', lng: -0.2161, lat: 51.4640, voltage: 33000, assetType: 'substation' },

  // Eastern area
  { name: 'Newmarket DSS', region: 'EPN', lng: 0.4065, lat: 52.2439, voltage: 33000, assetType: 'substation' },
  { name: 'Thetford DSS', region: 'EPN', lng: 0.7523, lat: 52.4166, voltage: 33000, assetType: 'substation' },
  { name: 'Diss DSS', region: 'EPN', lng: 1.1077, lat: 52.3797, voltage: 33000, assetType: 'substation' },
  { name: 'Felixstowe DSS', region: 'EPN', lng: 1.3512, lat: 51.9634, voltage: 33000, assetType: 'substation' },
  { name: 'Woodbridge DSS', region: 'EPN', lng: 1.3181, lat: 52.0936, voltage: 33000, assetType: 'substation' },
  { name: 'Stowmarket DSS', region: 'EPN', lng: 0.9983, lat: 52.1890, voltage: 33000, assetType: 'substation' },
  { name: 'Haverhill DSS', region: 'EPN', lng: 0.4412, lat: 52.0816, voltage: 33000, assetType: 'substation' },
  { name: 'Saffron Walden DSS', region: 'EPN', lng: 0.2421, lat: 52.0256, voltage: 33000, assetType: 'substation' },
  { name: 'Bishops Stortford DSS', region: 'EPN', lng: 0.1712, lat: 51.8723, voltage: 33000, assetType: 'substation' },
  { name: 'Witham DSS', region: 'EPN', lng: 0.6397, lat: 51.7967, voltage: 33000, assetType: 'substation' },
  { name: 'Maldon DSS', region: 'EPN', lng: 0.6741, lat: 51.7318, voltage: 33000, assetType: 'substation' },
  { name: 'Rayleigh DSS', region: 'EPN', lng: 0.5995, lat: 51.5857, voltage: 33000, assetType: 'substation' },
  { name: 'Canvey Island DSS', region: 'EPN', lng: 0.5810, lat: 51.5216, voltage: 33000, assetType: 'substation' },
  { name: 'Grays DSS', region: 'EPN', lng: 0.3217, lat: 51.4753, voltage: 33000, assetType: 'substation' },
  { name: 'Tilbury DSS', region: 'EPN', lng: 0.3537, lat: 51.4614, voltage: 33000, assetType: 'substation' },

  // South Eastern area
  { name: 'Sittingbourne DSS', region: 'SPN', lng: 0.7350, lat: 51.3420, voltage: 33000, assetType: 'substation' },
  { name: 'Faversham DSS', region: 'SPN', lng: 0.8872, lat: 51.3148, voltage: 33000, assetType: 'substation' },
  { name: 'Whitstable DSS', region: 'SPN', lng: 1.0253, lat: 51.3609, voltage: 33000, assetType: 'substation' },
  { name: 'Herne Bay DSS', region: 'SPN', lng: 1.1245, lat: 51.3714, voltage: 33000, assetType: 'substation' },
  { name: 'Margate DSS', region: 'SPN', lng: 1.3865, lat: 51.3860, voltage: 33000, assetType: 'substation' },
  { name: 'Deal DSS', region: 'SPN', lng: 1.4019, lat: 51.2221, voltage: 33000, assetType: 'substation' },
  { name: 'Hythe DSS', region: 'SPN', lng: 1.0833, lat: 51.0719, voltage: 33000, assetType: 'substation' },
  { name: 'New Romney DSS', region: 'SPN', lng: 0.9428, lat: 50.9887, voltage: 33000, assetType: 'substation' },
  { name: 'Rye DSS', region: 'SPN', lng: 0.7340, lat: 50.9503, voltage: 33000, assetType: 'substation' },
  { name: 'Bexhill DSS', region: 'SPN', lng: 0.4679, lat: 50.8419, voltage: 33000, assetType: 'substation' },
  { name: 'Peacehaven DSS', region: 'SPN', lng: -0.0091, lat: 50.7929, voltage: 33000, assetType: 'substation' },
  { name: 'Newhaven DSS', region: 'SPN', lng: 0.0541, lat: 50.7933, voltage: 33000, assetType: 'substation' },
  { name: 'Seaford DSS', region: 'SPN', lng: 0.1072, lat: 50.7717, voltage: 33000, assetType: 'substation' },
  { name: 'Uckfield DSS', region: 'SPN', lng: 0.0960, lat: 50.9703, voltage: 33000, assetType: 'substation' },
  { name: 'Crowborough DSS', region: 'SPN', lng: 0.1633, lat: 51.0583, voltage: 33000, assetType: 'substation' },
  { name: 'Paddock Wood DSS', region: 'SPN', lng: 0.3915, lat: 51.1829, voltage: 33000, assetType: 'substation' },
  { name: 'Tenterden DSS', region: 'SPN', lng: 0.6880, lat: 51.0688, voltage: 33000, assetType: 'substation' },
  { name: 'Cranbrook DSS', region: 'SPN', lng: 0.5437, lat: 51.0952, voltage: 33000, assetType: 'substation' },
  { name: 'Edenbridge DSS', region: 'SPN', lng: 0.0659, lat: 51.1959, voltage: 33000, assetType: 'substation' },
  { name: 'East Grinstead DSS', region: 'SPN', lng: -0.0094, lat: 51.1261, voltage: 33000, assetType: 'substation' },
  { name: 'Haywards Heath DSS', region: 'SPN', lng: -0.1043, lat: 51.0020, voltage: 33000, assetType: 'substation' },
  { name: 'Burgess Hill DSS', region: 'SPN', lng: -0.1275, lat: 50.9548, voltage: 33000, assetType: 'substation' },
  { name: 'Shoreham DSS', region: 'SPN', lng: -0.2677, lat: 50.8322, voltage: 33000, assetType: 'substation' },
  { name: 'Littlehampton DSS', region: 'SPN', lng: -0.5411, lat: 50.8097, voltage: 33000, assetType: 'substation' },
  { name: 'Bognor Regis DSS', region: 'SPN', lng: -0.6735, lat: 50.7870, voltage: 33000, assetType: 'substation' },
  { name: 'Midhurst DSS', region: 'SPN', lng: -0.7360, lat: 50.9863, voltage: 33000, assetType: 'substation' },
  { name: 'Petersfield DSS', region: 'SPN', lng: -0.9370, lat: 51.0041, voltage: 33000, assetType: 'substation' },
  { name: 'Haslemere DSS', region: 'SPN', lng: -0.7135, lat: 51.0899, voltage: 33000, assetType: 'substation' },
  { name: 'Godalming DSS', region: 'SPN', lng: -0.6142, lat: 51.1853, voltage: 33000, assetType: 'substation' },

  // === 11kV DISTRIBUTION TRANSFORMERS ===
  // London
  { name: 'Angel Transformer', region: 'LPN', lng: -0.1058, lat: 51.5320, voltage: 11000, assetType: 'transformer' },
  { name: 'Kings Cross Transformer', region: 'LPN', lng: -0.1246, lat: 51.5308, voltage: 11000, assetType: 'transformer' },
  { name: 'Euston Transformer', region: 'LPN', lng: -0.1339, lat: 51.5282, voltage: 11000, assetType: 'transformer' },
  { name: 'Liverpool Street Transformer', region: 'LPN', lng: -0.0815, lat: 51.5177, voltage: 11000, assetType: 'transformer' },
  { name: 'Tower Hill Transformer', region: 'LPN', lng: -0.0765, lat: 51.5101, voltage: 11000, assetType: 'transformer' },
  { name: 'London Bridge Transformer', region: 'LPN', lng: -0.0866, lat: 51.5053, voltage: 11000, assetType: 'transformer' },
  { name: 'Elephant Castle Transformer', region: 'LPN', lng: -0.1005, lat: 51.4943, voltage: 11000, assetType: 'transformer' },
  { name: 'Waterloo Transformer', region: 'LPN', lng: -0.1134, lat: 51.5031, voltage: 11000, assetType: 'transformer' },
  { name: 'Vauxhall Transformer', region: 'LPN', lng: -0.1236, lat: 51.4863, voltage: 11000, assetType: 'transformer' },
  { name: 'Kennington Transformer', region: 'LPN', lng: -0.1058, lat: 51.4884, voltage: 11000, assetType: 'transformer' },

  // Eastern
  { name: 'Ely Transformer', region: 'EPN', lng: 0.2622, lat: 52.3995, voltage: 11000, assetType: 'transformer' },
  { name: 'Downham Market Transformer', region: 'EPN', lng: 0.3812, lat: 52.6067, voltage: 11000, assetType: 'transformer' },
  { name: 'Swaffham Transformer', region: 'EPN', lng: 0.6885, lat: 52.6483, voltage: 11000, assetType: 'transformer' },
  { name: 'Attleborough Transformer', region: 'EPN', lng: 1.0170, lat: 52.5192, voltage: 11000, assetType: 'transformer' },
  { name: 'Wymondham Transformer', region: 'EPN', lng: 1.1182, lat: 52.5689, voltage: 11000, assetType: 'transformer' },
  { name: 'Beccles Transformer', region: 'EPN', lng: 1.5639, lat: 52.4576, voltage: 11000, assetType: 'transformer' },
  { name: 'Halesworth Transformer', region: 'EPN', lng: 1.5015, lat: 52.3428, voltage: 11000, assetType: 'transformer' },
  { name: 'Saxmundham Transformer', region: 'EPN', lng: 1.4918, lat: 52.2200, voltage: 11000, assetType: 'transformer' },
  { name: 'Leiston Transformer', region: 'EPN', lng: 1.5736, lat: 52.2071, voltage: 11000, assetType: 'transformer' },
  { name: 'Aldeburgh Transformer', region: 'EPN', lng: 1.6019, lat: 52.1522, voltage: 11000, assetType: 'transformer' },

  // South Eastern
  { name: 'Dartford Transformer', region: 'SPN', lng: 0.2149, lat: 51.4463, voltage: 11000, assetType: 'transformer' },
  { name: 'Gravesend Transformer', region: 'SPN', lng: 0.3670, lat: 51.4415, voltage: 11000, assetType: 'transformer' },
  { name: 'Rochester Transformer', region: 'SPN', lng: 0.5004, lat: 51.3878, voltage: 11000, assetType: 'transformer' },
  { name: 'Chatham Transformer', region: 'SPN', lng: 0.5257, lat: 51.3797, voltage: 11000, assetType: 'transformer' },
  { name: 'Gillingham Transformer', region: 'SPN', lng: 0.5508, lat: 51.3859, voltage: 11000, assetType: 'transformer' },
  { name: 'Rainham Transformer', region: 'SPN', lng: 0.6106, lat: 51.3658, voltage: 11000, assetType: 'transformer' },
  { name: 'Sheerness Transformer', region: 'SPN', lng: 0.7660, lat: 51.4413, voltage: 11000, assetType: 'transformer' },
  { name: 'Sandwich Transformer', region: 'SPN', lng: 1.3391, lat: 51.2749, voltage: 11000, assetType: 'transformer' },
  { name: 'Broadstairs Transformer', region: 'SPN', lng: 1.4390, lat: 51.3601, voltage: 11000, assetType: 'transformer' },
  { name: 'Westgate Transformer', region: 'SPN', lng: 1.3398, lat: 51.3815, voltage: 11000, assetType: 'transformer' },
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
 * Generate all assets from real infrastructure locations only
 * All investments are placed on actual OIM infrastructure objects
 */
function generateAssets() {
  console.log(`Generating assets from ${INFRASTRUCTURE_LOCATIONS.length} real infrastructure locations...`);

  const assets = [];
  let assetId = 1;

  // Use all real infrastructure locations
  for (const location of INFRASTRUCTURE_LOCATIONS) {
    const region = UKPN_REGIONS[location.region];
    const point = { lng: location.lng, lat: location.lat };
    const isUrban = isNearUrbanCenter(point, region);
    const boundaries = assignBoundaries(location.region, point, rng);

    assets.push({
      id: `asset-${String(assetId++).padStart(4, '0')}`,
      coordinates: [location.lng, location.lat],
      assetType: location.assetType,
      voltage: location.voltage,
      name: location.name,
      region: location.region,
      boundaries,
      investmentsByYear: generateAssetInvestments(location.assetType, location.voltage, isUrban, rng),
    });
  }

  console.log(`Generated ${assets.length} assets from real infrastructure locations`);

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
  console.log('========================================');
  console.log('PowerMap Investment Data Generator');
  console.log('========================================\n');
  console.log('Using real infrastructure locations from OIM data');
  console.log('');

  // Generate assets from real infrastructure locations
  const assets = generateAssets();

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
