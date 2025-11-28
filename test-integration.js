#!/usr/bin/env node
/**
 * Integration test for V2V system with blockchain
 * Tests the complete flow: Blockchain → API → Database
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBlockchainStatus() {
  log('\n1️⃣  Testing Blockchain Status...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/blockchain/status`);
    const data = response.data;
    
    if (!data.enabled) {
      log('   ⚠️  Blockchain not enabled', 'yellow');
      log('   Make sure contracts are deployed and .env is configured', 'yellow');
      return false;
    }
    
    log(`   ✅ Blockchain connected`, 'green');
    log(`   Chain ID: ${data.chainId}`);
    log(`   Block: ${data.blockNumber}`);
    log(`   Vehicles: ${data.stats.totalVehicles}`);
    log(`   Hazards: ${data.stats.totalHazards}`);
    log(`   Nodes: ${data.stats.totalNodes}`);
    return true;
  } catch (err) {
    log(`   ❌ Failed: ${err.message}`, 'red');
    return false;
  }
}

async function testAlertSubmission() {
  log('\n2️⃣  Testing Alert Submission...', 'blue');
  try {
    const alert = {
      msg_type: 'hazard_report',
      ephemeral_id: 'test_vehicle_001',
      location: [40.7128, -74.0060],
      hazard_type: 'ice_patch',
      confidence: 0.85,
      signature: 'test_signature_123'
    };
    
    log('   Sending alert...', 'yellow');
    const response = await axios.post(`${API_URL}/alert`, alert);
    const data = response.data;
    
    log(`   ✅ Alert accepted`, 'green');
    log(`   Alert Key: ${data.alert_key}`);
    log(`   Blockchain TX: ${data.blockchain_tx || 'N/A'}`);
    log(`   Hazard ID: ${data.blockchain_hazard_id || 'N/A'}`);
    
    return data.blockchain_hazard_id;
  } catch (err) {
    log(`   ❌ Failed: ${err.response?.data?.error || err.message}`, 'red');
    return null;
  }
}

async function testBlockchainHazardQuery(hazardId) {
  if (!hazardId) {
    log('\n3️⃣  Skipping Blockchain Hazard Query (no hazard ID)', 'yellow');
    return;
  }
  
  log('\n3️⃣  Testing Blockchain Hazard Query...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/blockchain/hazard/${hazardId}`);
    const data = response.data;
    
    log(`   ✅ Hazard retrieved from blockchain`, 'green');
    log(`   Vehicle: ${data.vehicleID}`);
    log(`   Type: ${data.hazardType}`);
    log(`   Location: (${data.latitude}, ${data.longitude})`);
    log(`   Confidence: ${data.confidence * 100}%`);
    log(`   Confirmations: ${data.confirmations}`);
    log(`   Verified: ${data.verified}`);
  } catch (err) {
    log(`   ❌ Failed: ${err.response?.data?.error || err.message}`, 'red');
  }
}

async function testBlockchainVehicleQuery() {
  log('\n4️⃣  Testing Blockchain Vehicle Query...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/blockchain/vehicle/test_vehicle_001`);
    const data = response.data;
    
    log(`   ✅ Vehicle retrieved from blockchain`, 'green');
    log(`   Vehicle ID: ${data.vehicleID}`);
    log(`   Status: ${data.status}`);
    log(`   Owner: ${data.owner}`);
  } catch (err) {
    log(`   ❌ Failed: ${err.response?.data?.error || err.message}`, 'red');
  }
}

async function testDatabaseQuery() {
  log('\n5️⃣  Testing Database Query...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/alerts`);
    const data = response.data;
    
    log(`   ✅ Alerts retrieved from database`, 'green');
    log(`   Total alerts: ${data.alerts.length}`);
    
    if (data.alerts.length > 0) {
      const latest = data.alerts[0];
      log(`   Latest: ${latest.hazard_type} at (${latest.latitude}, ${latest.longitude})`);
    }
  } catch (err) {
    log(`   ❌ Failed: ${err.message}`, 'red');
  }
}

async function testMetrics() {
  log('\n6️⃣  Testing Metrics...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/metrics`);
    const data = response.data;
    
    log(`   ✅ Metrics retrieved`, 'green');
    log(`   Verified Alerts: ${data.verified_alerts}`);
    log(`   Total Events: ${data.total_events}`);
    log(`   Active Nodes: ${data.active_nodes}`);
  } catch (err) {
    log(`   ❌ Failed: ${err.message}`, 'red');
  }
}

async function main() {
  log('╔══════════════════════════════════════════════════════════╗', 'blue');
  log('║         V2V Integration Test Suite                      ║', 'blue');
  log('╚══════════════════════════════════════════════════════════╝', 'blue');
  
  log('\n📋 Prerequisites:', 'yellow');
  log('   1. Hardhat node running: npx hardhat node');
  log('   2. Contracts deployed: npm run deploy');
  log('   3. API server running: cd node && npm start');
  
  log('\n⏳ Waiting 2 seconds for services...');
  await sleep(2000);
  
  // Run tests
  const blockchainEnabled = await testBlockchainStatus();
  const hazardId = await testAlertSubmission();
  
  if (blockchainEnabled && hazardId) {
    await testBlockchainHazardQuery(hazardId);
    await testBlockchainVehicleQuery();
  }
  
  await testDatabaseQuery();
  await testMetrics();
  
  log('\n╔══════════════════════════════════════════════════════════╗', 'green');
  log('║              Integration Test Complete                   ║', 'green');
  log('╚══════════════════════════════════════════════════════════╝', 'green');
  
  log('\n✅ All tests completed!', 'green');
  log('\n📝 Next steps:', 'blue');
  log('   - Check logs for any errors');
  log('   - Test with Python simulator: cd node/scripts && python simulator.py');
  log('   - View dashboard: http://localhost:5001');
}

// Run tests
main().catch(err => {
  log(`\n❌ Test suite failed: ${err.message}`, 'red');
  process.exit(1);
});
