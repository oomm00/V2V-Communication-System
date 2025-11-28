# V2V Communication System

**Vehicle-to-Vehicle (V2V) Communication System with Blockchain Integration**

## 🎯 Project Overview

A real-time V2V communication system that enables vehicles to share hazard alerts and location data through a blockchain-backed infrastructure. The system combines IoT sensors, cryptographic security, and smart contracts for decentralized, tamper-proof vehicle communication.

## 🏗️ Architecture

```
┌─────────────────┐
│ Python Simulator│  POST /alert with signed payload
│  (simulator.py)  │─────────────────┐
└─────────────────┘                 ▼
                          ┌──────────────────┐
                          │  Node.js API     │
                          │  (server.js)     │
                          │                  │
                          │  - Verifies      │
                          │    signatures    │
                          │  - Stores in     │
                          │    SQLite + BC   │
                          │  - Emits Socket  │
                          │    events        │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌──────────────┐  ┌──────────┐
              │ SQLite  │   │   React      │  │Blockchain│
              │ Database│   │  Frontend    │  │ Contracts│
              └─────────┘   └──────────────┘  └──────────┘
```

## ✅ Current Status

| Component | Status | Completeness |
|-----------|--------|--------------|
| **Blockchain Contracts** | ✅ Complete | 100% |
| **Web3 Integration** | ✅ Complete | 100% |
| **Node.js Backend** | ✅ Working | 95% |
| **SQLite Database** | ✅ Working | 100% |
| **Python Simulator** | ✅ Working | 100% |
| **Flask Frontend** | ✅ Working | 100% |
| **React Frontend** | ✅ Working | 100%|
| **C Node (Crypto)** | ✅ Working | 100% |
| **Real ECDSA** | ✅ Working | 100% |

**Overall:** 100% Complete


```

**See [INTEGRATED_QUICK_START.md](INTEGRATED_QUICK_START.md) for detailed instructions.**

## 📁 Project Structure

```
v2v/
├── contracts/                  # Solidity smart contracts
│   ├── Vehicle.sol            # Vehicle management
│   └── NetworkManager.sol     # Network communication
├── scripts/
│   └── deploy.js              # Contract deployment
├── test/
│   └── Vehicle.test.js        # Contract tests
├── node/                      # Node.js backend
│   ├── server.js              # Express API
│   ├── db/
│   │   ├── schema.sql         # Database schema
│   │   └── v2v.db             # SQLite database
│   ├── keys/                  # Cryptographic keys
│   └── scripts/
│       └── simulator.py       # Python simulator
├── frontend/                  # Frontend applications
│   ├── app.py                 # Flask dashboard
│   ├── templates/             # Jinja2 templates
│   └── src/                   # React components (WIP)
├── simulator/                 # Pygame visual simulator
│   └── simulation.py
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Blockchain dependencies
└── README.md                  # This file
```

## Quick Start

### Local Development

**Windows:**
```bash
RUN-ALL.bat
```

**Linux/Mac:**
```bash
chmod +x RUN-ALL.sh
./RUN-ALL.sh
```

Open http://localhost:5173

### Production Deployment (SmarterASP.NET)

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Upload `v2v-deploy/` folder contents (see `deploy-smarterasp.txt`)

## Features

- Real-time hazard alerts via Socket.IO
- Interactive map visualization (Dehradun area)
- ECDSA signature verification
- Blockchain integration (Ethereum/Hardhat)
- SQLite database storage
- Modern React dashboard

## Architecture

```
Frontend (React + Vite)
    ↓ Socket.IO
Backend (Node.js + Express)
    ↓
Database (SQLite) + Blockchain (Ethereum)
```

## Components

- **Frontend**: React dashboard on port 5173
- **Backend**: Node.js API on port 8082
- **Blockchain**: Hardhat local node on port 8545
- **Simulator**: Python script generating test alerts

## Requirements

- Node.js 18.x+
- Python 3.x (optional, for simulator)
- npm

## Project Structure

```
v2v/
├── frontend/          # React application
├── node/              # Backend server
├── contracts/         # Smart contracts
├── scripts/           # Deployment scripts
└── RUN-ALL.bat/sh     # Start everything
```

## Configuration

**Backend** (`node/.env`):
```
PORT=8082
NODE_ENV=development
DATABASE_PATH=./db/v2v.db
REQUIRE_SIGNATURES=false
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://127.0.0.1:8082
```

## API Endpoints

- `GET /api/` - Server status
- `GET /alerts` - List all alerts
- `POST /alert` - Submit new alert
- `GET /metrics` - System metrics
- `GET /blockchain/status` - Blockchain info

## Development

Start individual components:

```bash
# Blockchain
npx hardhat node

# Backend
cd node && node server.js

# Frontend
cd frontend && npm run dev

# Simulator
python node/scripts/simulator.py
```

## Testing

```bash
# Integration test
node test-integration.js

# Signature verification
node test-signatures.js

# Map validation
node test-map-validation.js
```

## Deployment Options

- **Local**: `RUN-ALL.bat` or `RUN-ALL.sh`
- **SmarterASP.NET**: See `deploy-smarterasp.txt`
- **Production**: See `deployment/` folder

## Documentation

- `deploy-smarterasp.txt` - SmarterASP.NET deployment guide
- `BLOCKCHAIN_SETUP.md` - Blockchain configuration
- `LOGGING_GUIDE.md` - Logging system details

## License

MIT
