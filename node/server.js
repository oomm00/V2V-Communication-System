const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Server } = require("socket.io");
const SignatureVerifier = require("./src/utils/signatureVerifier");
const { Web3 } = require("web3");
const logger = require("./src/utils/logger");
require("dotenv").config();

const app = express(); // ✅ create the app
const server = http.createServer(app);

// IISNode and SmarterASP.NET compatible Socket.IO configuration
const io = new Server(server, {
	path: '/socket.io/',
	transports: ['websocket', 'polling'],
	cors: {
		origin: true,
		methods: ["GET", "POST"],
		credentials: true
	},
	allowEIO3: true
});

// IISNode environment variables support
const PORT = process.env.PORT || process.env.IISNODE_PORT || 8082;
const HOST = process.env.HOST || process.env.IISNODE_HOST || '127.0.0.1';

// ==================== BLOCKCHAIN SETUP ====================

let web3 = null;
let vehicleContract = null;
let networkManagerContract = null;
let blockchainEnabled = false;

async function initBlockchain() {
	try {
		const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
		const vehicleAddress = process.env.VEHICLE_CONTRACT_ADDRESS;
		const networkManagerAddress = process.env.NETWORK_MANAGER_ADDRESS;

		if (!vehicleAddress || !networkManagerAddress) {
			logger.warn("Blockchain contracts not configured - running without blockchain");
			logger.warn("Set VEHICLE_CONTRACT_ADDRESS and NETWORK_MANAGER_ADDRESS in .env");
			return;
		}

		web3 = new Web3(rpcUrl);
		
		// Test connection
		const isConnected = await web3.eth.net.isListening();
		if (!isConnected) {
			throw new Error("Cannot connect to blockchain RPC");
		}

		// Load contract ABIs
		const vehicleABI = require("../artifacts/contracts/Vehicle.sol/Vehicle.json").abi;
		const networkManagerABI = require("../artifacts/contracts/NetworkManager.sol/NetworkManager.json").abi;

		// Initialize contracts
		vehicleContract = new web3.eth.Contract(vehicleABI, vehicleAddress);
		networkManagerContract = new web3.eth.Contract(networkManagerABI, networkManagerAddress);

		// Get network info
		const chainId = await web3.eth.getChainId();
		const blockNumber = await web3.eth.getBlockNumber();

		blockchainEnabled = true;
		logger.info("Blockchain connected", {
			rpc: rpcUrl,
			chainId: chainId.toString(),
			blockNumber: blockNumber.toString(),
			vehicleContract: vehicleAddress,
			networkManagerContract: networkManagerAddress
		});
	} catch (err) {
		logger.error("Blockchain initialization failed", {
			error: err.message,
			stack: err.stack
		});
		logger.info("Running in database-only mode");
		blockchainEnabled = false;
	}
}

app.use(cors());
app.use(bodyParser.json());

// Key registry
const keysDir = path.join(__dirname, "keys");
const pubKeysPath = path.join(keysDir, "publicKeys.json");

// SQLite database
const dbPath = path.join(__dirname, "db", "v2v.db");
let db = null;

// Signature verification
const REQUIRE_SIGNATURES = process.env.REQUIRE_SIGNATURES === 'true' || process.env.NODE_ENV === 'production';
let signatureVerifier = null;

function initSignatureVerifier() {
	try {
		signatureVerifier = new SignatureVerifier(pubKeysPath);
		if (REQUIRE_SIGNATURES) {
			logger.info("Signature verification ENABLED");
		} else {
			logger.warn("Signature verification DISABLED (development mode)");
		}
	} catch (err) {
		logger.error("Failed to initialize signature verifier", {
			error: err.message,
			stack: err.stack
		});
		signatureVerifier = null;
	}
}

function ensureKeyRegistry() {
	if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });
	if (!fs.existsSync(pubKeysPath)) fs.writeFileSync(pubKeysPath, JSON.stringify({}, null, 2));
}

function loadRegistry() {
	ensureKeyRegistry();
	try {
		const raw = fs.readFileSync(pubKeysPath, "utf8");
		return JSON.parse(raw || "{}");
	} catch (e) {
		logger.error("Failed to read publicKeys.json", {
			error: e.message,
			path: pubKeysPath
		});
		return {};
	}
}

function saveRegistry(reg) {
	try {
		fs.writeFileSync(pubKeysPath, JSON.stringify(reg, null, 2));
	} catch (e) {
		logger.error("Failed to write publicKeys.json", {
			error: e.message,
			path: pubKeysPath
		});
	}
}

// Initialize SQLite database
function initDatabase() {
	fs.mkdirSync(path.join(__dirname, "db"), { recursive: true });
	
	db = new sqlite3.Database(dbPath, (err) => {
		if (err) {
			logger.error("Database connection error", {
				error: err.message,
				path: dbPath
			});
			process.exit(1);
		}
		logger.info("Connected to SQLite database", { path: dbPath });
	});

	// Create tables
	const schema = fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8");
	db.exec(schema, (err) => {
		if (err) {
			logger.error("Database schema error", {
				error: err.message
			});
		} else {
			logger.info("Database schema initialized");
		}
	});
}

// Initialize on startup
initDatabase();
initBlockchain();
initSignatureVerifier();

// ==================== REST API ENDPOINTS ====================

/**
 * POST /alert
 * Receive and verify a hazard alert from simulator
 */
app.post("/alert", async (req, res) => {
	try {
		const { msg_type, ephemeral_id, location, hazard_type, signature, confidence } = req.body;

		// Validate required fields
		if (!msg_type || !ephemeral_id || !location || !hazard_type || !signature) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		// Verify signature if enabled
		if (REQUIRE_SIGNATURES && signatureVerifier) {
			const verificationResult = signatureVerifier.verifySignature(req.body);
			
			if (!verificationResult.valid) {
				const statusCode = verificationResult.code === 'UNKNOWN_ID' ? 403 :
				                   verificationResult.code === 'REPLAY_ATTACK' ? 409 : 401;
				
				logger.logSignature(false, ephemeral_id, verificationResult.error);
				
				return res.status(statusCode).json({
					error: verificationResult.error,
					code: verificationResult.code,
					ephemeral_id,
					timestamp: Date.now()
				});
			}
			
			logger.logSignature(true, ephemeral_id);
		}
		
		const alertKey = `${hazard_type}_${location[0].toFixed(4)}_${location[1].toFixed(4)}`;
		const timestamp = Date.now();

		let blockchainTxHash = null;
		let blockchainHazardId = null;

		// Store on blockchain if enabled
		if (blockchainEnabled && vehicleContract) {
			try {
				const accounts = await web3.eth.getAccounts();
				if (accounts.length === 0) {
					throw new Error("No accounts available");
				}

				// Convert location to integers (multiply by 1e6 for precision)
				const latInt = Math.floor(location[0] * 1e6);
				const lonInt = Math.floor(location[1] * 1e6);
				const confidenceInt = Math.floor((confidence || 0.8) * 100);

				// Check if vehicle is registered, if not register it
				try {
					const vehicleData = await vehicleContract.methods.getVehicle(ephemeral_id).call();
					if (!vehicleData[0]) { // vehicleID is empty
						logger.logBlockchain('register_vehicle', { vehicleId: ephemeral_id });
						await vehicleContract.methods.registerVehicle(ephemeral_id)
							.send({ from: accounts[0], gas: 200000 });
					}
				} catch (regErr) {
					// Vehicle might not exist, try to register
					logger.logBlockchain('register_vehicle', { vehicleId: ephemeral_id });
					await vehicleContract.methods.registerVehicle(ephemeral_id)
						.send({ from: accounts[0], gas: 200000 });
				}

				// Report hazard on blockchain
				logger.logBlockchain('report_hazard', {
					hazardType: hazard_type,
					location: { lat: location[0], lon: location[1] },
					vehicleId: ephemeral_id
				});
				
				const tx = await vehicleContract.methods.reportHazard(
					ephemeral_id,
					hazard_type,
					latInt,
					lonInt,
					confidenceInt
				).send({ from: accounts[0], gas: 300000 });

				blockchainTxHash = tx.transactionHash;
				
				// Extract hazard ID from events
				if (tx.events && tx.events.HazardReported) {
					blockchainHazardId = tx.events.HazardReported.returnValues.hazardId;
				}

				logger.logBlockchain('hazard_stored', {
					txHash: blockchainTxHash,
					hazardId: blockchainHazardId
				});
			} catch (blockchainErr) {
				logger.error("Blockchain storage failed", {
					error: blockchainErr.message,
					stack: blockchainErr.stack,
					vehicleId: ephemeral_id,
					hazardType: hazard_type
				});
				// Continue with database storage even if blockchain fails
			}
		}

		// Store in database (always, for fast queries)
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO verified_alerts 
			(alert_key, latitude, longitude, hazard_type, confidence, verified_at, confirmations, raw_payload)
			VALUES (?, ?, ?, ?, ?, ?, 1, ?)
		`);

		stmt.run(
			alertKey,
			location[0],
			location[1],
			hazard_type,
			confidence || 0.8,
			timestamp,
			JSON.stringify(req.body)
		);

		stmt.finalize();

		// Log event
		


		logger.logAlert(alertKey, ephemeral_id, hazard_type, location);

		// Broadcast via Socket.IO
		io.emit("new_alert", {
			alert_key: alertKey,
			hazard_type,
			location,
			timestamp,
			confidence,
			blockchain_tx: blockchainTxHash,
			blockchain_hazard_id: blockchainHazardId
		});

		res.json({ 
			status: "verified", 
			alert_key: alertKey, 
			timestamp,
			blockchain_tx: blockchainTxHash,
			blockchain_hazard_id: blockchainHazardId,
			blockchain_enabled: blockchainEnabled
		});
	} catch (err) {
		logger.logError("alert_processing", err, {
			ephemeralId: req.body?.ephemeral_id,
			hazardType: req.body?.hazard_type
		});
		res.status(500).json({ error: err.message });
	}
});

/**
 * GET /alerts
 * Get all verified alerts
 */
app.get("/alerts", (req, res) => {
	db.all(
		"SELECT * FROM verified_alerts ORDER BY verified_at DESC LIMIT 100",
		(err, rows) => {
			if (err) {
				logger.error("Database query error", {
					error: err.message,
					query: "SELECT verified_alerts"
				});
				return res.status(500).json({ error: err.message });
			}
			
			res.json({ alerts: rows || [] });
		}
	);
});

/**
 * GET /metrics
 * Get system metrics
 */
app.get("/metrics", (req, res) => {
	db.get("SELECT COUNT(*) as total_alerts FROM verified_alerts", (err, alertRow) => {
		if (err) {
			return res.json({
				messages_per_sec: 0,
				rejected_count: 0,
				active_nodes: 0,
				verified_alerts: 0
			});
		}

		db.get("SELECT COUNT(*) as total_events FROM audit_log", (err, eventRow) => {
			res.json({
				messages_per_sec: 0.5, // Mock
				rejected_count: 0,
				active_nodes: 1,
				verified_alerts: alertRow.total_alerts || 0,
				total_events: eventRow.total_events || 0
			});
		});
	});
});

/**
 * POST /report
 * Accept hazard report (for web form)
 */
app.post("/report", (req, res) => {
	try {
		const { hazard_type, location, confidence, ttl_seconds } = req.body;

		const alertKey = `${hazard_type}_${location[0].toFixed(4)}_${location[1].toFixed(4)}`;
		const timestamp = Date.now();

		db.run(
			`INSERT OR REPLACE INTO verified_alerts 
			(alert_key, latitude, longitude, hazard_type, confidence, verified_at, confirmations, raw_payload)
			VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
			[alertKey, location[0], location[1], hazard_type, confidence, timestamp, JSON.stringify(req.body)]
		);

		io.emit("new_alert", { alert_key: alertKey, hazard_type, location, timestamp, confidence });

		res.json({ status: "success", alert_key: alertKey });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * GET /blockchain/status
 * Get blockchain connection status
 */
app.get("/blockchain/status", async (req, res) => {
	if (!blockchainEnabled) {
		return res.json({
			enabled: false,
			message: "Blockchain not configured"
		});
	}

	try {
		const chainId = await web3.eth.getChainId();
		const blockNumber = await web3.eth.getBlockNumber();
		const accounts = await web3.eth.getAccounts();
		
		const totalVehicles = await vehicleContract.methods.getTotalVehicles().call();
		const totalHazards = await vehicleContract.methods.getTotalHazards().call();
		const totalNodes = await networkManagerContract.methods.getTotalNodes().call();

		res.json({
			enabled: true,
			connected: true,
			chainId: chainId.toString(),
			blockNumber: blockNumber.toString(),
			accounts: accounts.length,
			contracts: {
				vehicle: process.env.VEHICLE_CONTRACT_ADDRESS,
				networkManager: process.env.NETWORK_MANAGER_ADDRESS
			},
			stats: {
				totalVehicles: totalVehicles.toString(),
				totalHazards: totalHazards.toString(),
				totalNodes: totalNodes.toString()
			}
		});
	} catch (err) {
		res.status(500).json({
			enabled: true,
			connected: false,
			error: err.message
		});
	}
});

/**
 * GET /blockchain/hazard/:id
 * Get hazard details from blockchain
 */
app.get("/blockchain/hazard/:id", async (req, res) => {
	if (!blockchainEnabled) {
		return res.status(503).json({ error: "Blockchain not enabled" });
	}

	try {
		const hazardId = req.params.id;
		const hazard = await vehicleContract.methods.getHazard(hazardId).call();

		res.json({
			id: hazard[0].toString(),
			vehicleID: hazard[1],
			hazardType: hazard[2],
			latitude: parseInt(hazard[3]) / 1e6,
			longitude: parseInt(hazard[4]) / 1e6,
			confidence: parseInt(hazard[5]) / 100,
			timestamp: hazard[6].toString(),
			confirmations: hazard[7].toString(),
			verified: hazard[8]
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * GET /blockchain/vehicle/:id
 * Get vehicle details from blockchain
 */
app.get("/blockchain/vehicle/:id", async (req, res) => {
	if (!blockchainEnabled) {
		return res.status(503).json({ error: "Blockchain not enabled" });
	}

	try {
		const vehicleId = req.params.id;
		const vehicle = await vehicleContract.methods.getVehicle(vehicleId).call();

		res.json({
			vehicleID: vehicle[0],
			latitude: parseInt(vehicle[1]) / 1e6,
			longitude: parseInt(vehicle[2]) / 1e6,
			speed: vehicle[3].toString(),
			status: vehicle[4],
			timestamp: vehicle[5].toString(),
			owner: vehicle[6]
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get("/", (req, res) => {
	res.json({
		status: "running",
		message: "V2V API Server",
		blockchain: blockchainEnabled ? "enabled" : "disabled",
		endpoints: {
			alerts: "/alerts",
			metrics: "/metrics",
			blockchain_status: "/blockchain/status",
			blockchain_hazard: "/blockchain/hazard/:id",
			blockchain_vehicle: "/blockchain/vehicle/:id"
		}
	});
});

// ==================== SOCKET.IO ====================

io.on("connection", (socket) => {
	logger.info("Socket.IO client connected", { socketId: socket.id });

	socket.on("vehicle_update", async (payload) => {
		try {
			if (!payload || typeof payload !== "object") {
				return socket.emit("vehicle_rejected", { reason: "invalid payload" });
			}

			const { vehicle_id, timestamp, position, speed, alert, signature, pubkey_b64 } = payload;

			// Broadcast to others
			socket.broadcast.emit("vehicle_valid", payload);
			logger.debug("Vehicle update forwarded", {
				vehicleId: vehicle_id,
				position: { lat: position?.lat, lng: position?.lng }
			});
		} catch (err) {
			logger.error("Vehicle update error", {
				error: err.message,
				stack: err.stack,
				socketId: socket.id
			});
		}
	});

	socket.on("disconnect", () => {
		logger.info("Socket.IO client disconnected", { socketId: socket.id });
	});
});

// Graceful shutdown
process.on("SIGINT", () => {
	logger.info("Shutting down gracefully...");
	db.close();
	process.exit(0);
});

server.listen(PORT, HOST, () => {
	logger.info("V2V Server started", {
		host: HOST,
		port: PORT,
		restApi: `http://${HOST}:${PORT}/alerts`,
		socketIo: `ws://${HOST}:${PORT}`,
		nodeEnv: process.env.NODE_ENV || 'development',
		blockchainEnabled,
		iisnode: process.env.IISNODE_PORT ? 'enabled' : 'disabled'
	});
});
