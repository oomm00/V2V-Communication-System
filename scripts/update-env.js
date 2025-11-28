const fs = require('fs');
const path = require('path');

/**
 * Update .env file with deployed contract addresses
 * Run after deploying contracts: node scripts/update-env.js
 */

const deploymentsDir = path.join(__dirname, '..', 'deployments');
const nodeEnvPath = path.join(__dirname, '..', 'node', '.env');

// Find the latest deployment file
const deploymentFiles = fs.readdirSync(deploymentsDir)
  .filter(f => f.endsWith('.json') && f !== '.gitkeep');

if (deploymentFiles.length === 0) {
  console.error('❌ No deployment files found!');
  console.log('   Run: npm run deploy');
  process.exit(1);
}

// Use the most recent deployment
const latestDeployment = deploymentFiles.sort().reverse()[0];
const deploymentPath = path.join(deploymentsDir, latestDeployment);

console.log(`📄 Reading deployment: ${latestDeployment}`);

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const vehicleAddress = deployment.contracts.Vehicle.address;
const networkManagerAddress = deployment.contracts.NetworkManager.address;

console.log(`\n📋 Contract Addresses:`);
console.log(`   Vehicle: ${vehicleAddress}`);
console.log(`   NetworkManager: ${networkManagerAddress}`);

// Read current .env
let envContent = '';
if (fs.existsSync(nodeEnvPath)) {
  envContent = fs.readFileSync(nodeEnvPath, 'utf8');
}

// Update or add contract addresses
const updateEnvVar = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
};

envContent = updateEnvVar(envContent, 'VEHICLE_CONTRACT_ADDRESS', vehicleAddress);
envContent = updateEnvVar(envContent, 'NETWORK_MANAGER_ADDRESS', networkManagerAddress);

// Write updated .env
fs.writeFileSync(nodeEnvPath, envContent.trim() + '\n');

console.log(`\n✅ Updated: ${nodeEnvPath}`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Start Hardhat node: npx hardhat node`);
console.log(`   2. Start API server: cd node && npm start`);
console.log(`   3. Test: curl http://localhost:5000/blockchain/status`);
