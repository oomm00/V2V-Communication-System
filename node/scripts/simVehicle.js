const { io } = require("socket.io-client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SERVER = process.env.SERVER || "http://localhost:5000";
const VEHICLE_ID = process.env.VEHICLE_ID || "car1";
const PRIV_PATH = process.env.PRIV || path.join(__dirname, "..", "keys", `${VEHICLE_ID}_priv.pem`);

function signPayload(obj, privPem) {
	const payload = {
		vehicle_id: obj.vehicle_id,
		timestamp: obj.timestamp,
		position: { lat: obj.position.lat, lng: obj.position.lng },
		speed: obj.speed,
		alert: obj.alert || null
	};
	const canonical = JSON.stringify(payload);
	const signer = crypto.createSign("RSA-SHA256");
	signer.update(canonical);
	signer.end();
	const sig = signer.sign(privPem);
	return { canonical, signature_b64: sig.toString("base64") };
}

function pubFromPriv(privPem) {
	const keyObj = crypto.createPrivateKey(privPem);
	const pub = crypto.createPublicKey(keyObj).export({ type: "spki", format: "der" });
	return pub.toString("base64");
}

function randomDelta() {
	return (Math.random() - 0.5) * 0.0005;
}

async function main() {
	const privPem = fs.readFileSync(PRIV_PATH, "utf8");
	const pubkey_b64 = pubFromPriv(privPem);
	const socket = io(SERVER, { transports: ["websocket"], timeout: 2000 });

	socket.on("connect", () => console.log(`[sim] connected ${socket.id}`));
	socket.on("vehicle_rejected", (m) => console.log(`[rejected]`, m));
	socket.on("vehicle_valid", (m) => console.log(`[valid->peer]`, m));

	let lat = 40.7128, lng = -74.0060;
	setInterval(() => {
		lat += randomDelta();
		lng += randomDelta();
		const base = {
			vehicle_id: VEHICLE_ID,
			timestamp: Date.now(),
			position: { lat, lng },
			speed: 30 + Math.random() * 5,
			alert: Math.random() < 0.2 ? { type: "debris", confidence: 0.9 } : null
		};
		const { canonical, signature_b64 } = signPayload(base, privPem);
		socket.emit("vehicle_update", { ...base, signature: signature_b64, pubkey_b64 });
		console.log(`[sim] sent`, base.position);
	}, 2000);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});


