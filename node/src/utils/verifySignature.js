const crypto = require("crypto");

function toPemFromBase64(b64) {
	const der = Buffer.from(b64, "base64");
	const pemBody = der.toString("base64").match(/.{1,64}/g).join("\n");
	return `-----BEGIN PUBLIC KEY-----\n${pemBody}\n-----END PUBLIC KEY-----\n`;
}

async function verify(pubkey_b64, messageString, signature_b64) {
	try {
		const verifier = crypto.createVerify("RSA-SHA256");
		verifier.update(messageString);
		verifier.end();
		const pem = pubkeyToPem(pubkey_b64);
		const ok = verifier.verify(pem, Buffer.from(signature_b64, "base64"));
		return !!ok;
	} catch (e) {
		return false;
	}
}

function pubkeyToPem(pubkey_b64) {
	// Accept either raw b64 DER or already-PEM
	if (pubkey_b64.includes("BEGIN PUBLIC KEY")) return pubkey_b64;
	return toPemFromBase64(pubkey_b64);
}

module.exports = { verify, pubkeyToPem };


