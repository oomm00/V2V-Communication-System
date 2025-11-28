# V2V Blockchain Setup Guide

## ✅ Completed: Smart Contracts Implementation

The V2V system now includes full blockchain integration with two Solidity smart contracts:

### 📄 Contracts

1. **Vehicle.sol** - Manages vehicle registration, location updates, and hazard reporting
2. **NetworkManager.sol** - Handles node authorization and message relaying

### 🎯 Features Implemented

#### Vehicle Contract:
- ✅ Vehicle registration with unique IDs
- ✅ Real-time location updates (lat/lon stored as integers)
- ✅ Hazard reporting with confidence levels
- ✅ Hazard confirmation and auto-verification
- ✅ Vehicle status management (active/inactive/emergency)
- ✅ Event emissions for all major actions

#### NetworkManager Contract:
- ✅ Node authorization system
- ✅ Message relaying between nodes
- ✅ Broadcast messaging
- ✅ Message delivery tracking
- ✅ Node activity monitoring

---

## 🚀 Quick Start

### 1. Start Local Blockchain

**Option A: Hardhat Node (Recommended)**
```bash
cd v2v
npx hardhat node
```
This starts a local Ethereum node on `http://127.0.0.1:8545`

**Option B: Ganache**
```bash
ganache-cli --port 7545
```

### 2. Compile Contracts
```bash
cd v2v
npm run compile
```

### 3. Run Tests
```bash
npm test
```

Expected output: **12 passing tests** ✅

### 4. Deploy Contracts
```bash
# Deploy to Hardhat local network
npm run deploy

# Or deploy to Ganache
npm run deploy:ganache
```

### 5. Check Deployment
After deployment, you'll see:
```
✅ Vehicle contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ NetworkManager contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

Contract addresses are saved to:
- `deployments/localhost.json` (or `ganache.json`)
- `.env.example` (template for your .env file)

---

## 📁 Project Structure

```
v2v/
├── contracts/
│   ├── Vehicle.sol              # Vehicle management contract
│   └── NetworkManager.sol       # Network communication contract
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── Vehicle.test.js          # Contract tests
├── deployments/
│   └── localhost.json           # Deployment info
├── artifacts/                   # Compiled contracts
├── cache/                       # Hardhat cache
├── hardhat.config.js            # Hardhat configuration
└── package.json                 # Dependencies
```

---

## 🔧 Configuration

### hardhat.config.js
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337
    }
  }
};
```

### Environment Variables
Copy `.env.example` to `.env` and update:
```bash
BLOCKCHAIN_RPC_URL=http://localhost:8545
VEHICLE_CONTRACT_ADDRESS=0x5FbDB...
NETWORK_MANAGER_ADDRESS=0xe7f17...
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
```bash
npx hardhat coverage
```

### Gas Report
```bash
REPORT_GAS=true npx hardhat test
```

---

## 📊 Contract Details

### Vehicle Contract

**Key Functions:**
- `registerVehicle(string vehicleID)` - Register a new vehicle
- `updateLocation(string vehicleID, int256 lat, int256 lon, uint256 speed)` - Update position
- `reportHazard(string vehicleID, string hazardType, int256 lat, int256 lon, uint256 confidence)` - Report hazard
- `confirmHazard(uint256 hazardId)` - Confirm existing hazard
- `getVehicle(string vehicleID)` - Get vehicle data
- `getHazard(uint256 hazardId)` - Get hazard details

**Events:**
- `VehicleRegistered(string vehicleID, address owner, uint256 timestamp)`
- `VehicleUpdated(string vehicleID, int256 lat, int256 lon, uint256 speed, uint256 timestamp)`
- `HazardReported(uint256 hazardId, string vehicleID, string hazardType, int256 lat, int256 lon, uint256 timestamp)`
- `HazardVerified(uint256 hazardId, uint256 confirmations)`

### NetworkManager Contract

**Key Functions:**
- `authorizeNode(address nodeAddress, string nodeID)` - Authorize a node
- `deauthorizeNode(address nodeAddress)` - Remove node authorization
- `relayMessage(address to, bytes data, string messageType)` - Send message to specific node
- `broadcastMessage(bytes data, string messageType)` - Broadcast to all nodes
- `markMessageDelivered(uint256 messageId)` - Confirm message delivery
- `getNode(address nodeAddress)` - Get node details
- `getMessage(uint256 messageId)` - Get message details

**Events:**
- `NodeAuthorized(address nodeAddress, string nodeID, uint256 timestamp)`
- `MessageRelayed(uint256 messageId, address from, address to, uint256 timestamp)`
- `BroadcastMessage(uint256 messageId, address from, uint256 timestamp)`

---

## 🔗 Integration with Node.js Backend

### Install Web3.js
```bash
cd node
npm install web3 dotenv
```

### Update server.js
```javascript
const Web3 = require('web3');
require('dotenv').config();

const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
const vehicleContract = new web3.eth.Contract(
    require('../artifacts/contracts/Vehicle.sol/Vehicle.json').abi,
    process.env.VEHICLE_CONTRACT_ADDRESS
);

// Example: Report hazard to blockchain
app.post("/alert", async (req, res) => {
    const { ephemeral_id, location, hazard_type, confidence } = req.body;
    
    const accounts = await web3.eth.getAccounts();
    const tx = await vehicleContract.methods.reportHazard(
        ephemeral_id,
        hazard_type,
        Math.floor(location[0] * 1e6),
        Math.floor(location[1] * 1e6),
        Math.floor(confidence * 100)
    ).send({ from: accounts[0], gas: 300000 });
    
    console.log(`Hazard stored on blockchain: ${tx.transactionHash}`);
    res.json({ txHash: tx.transactionHash });
});
```

---

## 📝 Next Steps

1. ✅ **Contracts Deployed** - Smart contracts are ready
2. ⏳ **Integrate Web3** - Connect Node.js backend to blockchain
3. ⏳ **Update Simulator** - Make simulator interact with contracts
4. ⏳ **Frontend Integration** - Display blockchain data in React
5. ⏳ **Real ECDSA** - Implement signature verification

See `PROJECT_AUDIT_REPORT.md` for complete integration guide.

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to network"
```bash
# Make sure Hardhat node is running
npx hardhat node
```

### Issue: "Contract not deployed"
```bash
# Redeploy contracts
npm run deploy
```

### Issue: "Nonce too high"
```bash
# Reset Hardhat node
# Stop and restart: npx hardhat node
```

### Issue: "Gas estimation failed"
```bash
# Increase gas limit in transaction
.send({ from: account, gas: 500000 })
```

---

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

---

**Status:** ✅ TODO 1 COMPLETE - Blockchain smart contracts implemented and tested!
