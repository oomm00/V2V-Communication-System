const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting V2V Smart Contract Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Vehicle contract
  console.log("📦 Deploying Vehicle contract...");
  const Vehicle = await hre.ethers.getContractFactory("Vehicle");
  const vehicle = await Vehicle.deploy();
  await vehicle.waitForDeployment();
  const vehicleAddress = await vehicle.getAddress();
  console.log("✅ Vehicle contract deployed to:", vehicleAddress);

  // Deploy NetworkManager contract
  console.log("\n📦 Deploying NetworkManager contract...");
  const NetworkManager = await hre.ethers.getContractFactory("NetworkManager");
  const networkManager = await NetworkManager.deploy();
  await networkManager.waitForDeployment();
  const networkManagerAddress = await networkManager.getAddress();
  console.log("✅ NetworkManager contract deployed to:", networkManagerAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      Vehicle: {
        address: vehicleAddress,
        deployedAt: new Date().toISOString()
      },
      NetworkManager: {
        address: networkManagerAddress,
        deployedAt: new Date().toISOString()
      }
    },
    timestamp: Date.now()
  };

  // Save to JSON file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Create .env template
  const envTemplate = `
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
VEHICLE_CONTRACT_ADDRESS=${vehicleAddress}
NETWORK_MANAGER_ADDRESS=${networkManagerAddress}
DEPLOYER_ADDRESS=${deployer.address}
CHAIN_ID=${deploymentInfo.chainId}

# Node.js API
PORT=5000
NODE_ENV=development
DATABASE_PATH=./node/db/v2v.db

# Frontend
VITE_API_URL=http://localhost:5000
VITE_VEHICLE_CONTRACT=${vehicleAddress}
VITE_NETWORK_MANAGER_CONTRACT=${networkManagerAddress}
`;

  const envFile = path.join(__dirname, "..", ".env.example");
  fs.writeFileSync(envFile, envTemplate.trim());
  console.log("📄 .env.example created with contract addresses");

  // Update node/.env file
  const nodeEnvPath = path.join(__dirname, "..", "node", ".env");
  if (fs.existsSync(nodeEnvPath)) {
    let nodeEnvContent = fs.readFileSync(nodeEnvPath, "utf8");
    
    // Update contract addresses
    nodeEnvContent = nodeEnvContent.replace(
      /VEHICLE_CONTRACT_ADDRESS=.*/,
      `VEHICLE_CONTRACT_ADDRESS=${vehicleAddress}`
    );
    nodeEnvContent = nodeEnvContent.replace(
      /NETWORK_MANAGER_ADDRESS=.*/,
      `NETWORK_MANAGER_ADDRESS=${networkManagerAddress}`
    );
    
    fs.writeFileSync(nodeEnvPath, nodeEnvContent);
    console.log("📄 node/.env updated with contract addresses");
  }

  // Test contracts
  console.log("\n🧪 Testing deployed contracts...");
  
  // Test Vehicle contract
  console.log("\n1️⃣ Testing Vehicle contract:");
  const registerTx = await vehicle.registerVehicle("test_vehicle_001");
  await registerTx.wait();
  console.log("   ✅ Vehicle registered: test_vehicle_001");
  
  const vehicleData = await vehicle.getVehicle("test_vehicle_001");
  console.log("   📊 Vehicle data:", {
    vehicleID: vehicleData[0],
    status: vehicleData[4],
    owner: vehicleData[6]
  });

  const totalVehicles = await vehicle.getTotalVehicles();
  console.log("   📈 Total vehicles:", totalVehicles.toString());

  // Test NetworkManager contract
  console.log("\n2️⃣ Testing NetworkManager contract:");
  const authTx = await networkManager.authorizeNode(deployer.address, "node_001");
  await authTx.wait();
  console.log("   ✅ Node authorized: node_001");

  const isAuthorized = await networkManager.isNodeAuthorized(deployer.address);
  console.log("   🔐 Node authorization status:", isAuthorized);

  const totalNodes = await networkManager.getTotalNodes();
  console.log("   📈 Total nodes:", totalNodes.toString());

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   Vehicle:        ", vehicleAddress);
  console.log("   NetworkManager: ", networkManagerAddress);
  console.log("\n📝 Next Steps:");
  console.log("   1. Copy .env.example to .env");
  console.log("   2. Update node/server.js with Web3 integration");
  console.log("   3. Start the Node.js API: cd node && npm start");
  console.log("   4. Test with: curl http://localhost:5000/alerts");
  console.log("\n💡 Tip: Keep Ganache/Hardhat node running for local development");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
