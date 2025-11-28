# V2V Socket.IO Quick Start Guide

## 🚀 How to Run

### Step 1: Start the Server
Open a terminal in `node/` directory and run:
```bash
npm start
```
You should see: `Server running on http://localhost:5000`

### Step 2: Run the Simulator (in a new terminal)
Open another terminal in `node/` directory and run:
```bash
npm run sim
```

The simulator will:
- Generate RSA keys automatically (or use existing ones in `keys/`)
- Connect to the Socket.IO server
- Send signed vehicle updates every 2 seconds
- Display valid/rejected messages in console

### Step 3: Test Multiple Vehicles
In additional terminals, you can run:
```bash
# Simulate car2
VEHICLE_ID=car2 npm run sim

# Simulate car3  
VEHICLE_ID=car3 npm run sim
```

Or on Windows PowerShell:
```powershell
$env:VEHICLE_ID="car2"; npm run sim
```

## 📋 What You'll See

### Server Console:
```
Server running on http://localhost:5000
[socket] client connected abc123
[registry] saved/updated key for car1
[forward] from car1 @ (40.7128,-74.0060) speed=30.5
```

### Simulator Console:
```
[sim] connected xyz789
[sim] sent { lat: 40.7128, lng: -74.0060 }
```

## 🔧 Customization

You can override settings via environment variables:
```bash
SERVER=http://localhost:5000
VEHICLE_ID=car1
PRIV=../keys/car1_priv.pem
```

## 📝 Notes

- The server verifies RSA-SHA256 signatures on all incoming messages
- Valid messages are broadcast to all other connected clients
- Invalid messages are rejected and sender notified
- Public keys are saved to `keys/publicKeys.json` automatically

## 🛠️ Troubleshooting

If you see "ENOENT" errors, the key files don't exist. The simulator will generate them automatically on first run.

If port 5000 is busy, change it:
```bash
PORT=5001 npm start
```

