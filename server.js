const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// in-memory vote store
const results = new Map();

app.post("/vote", (req, res) => {
	const { candidate } = req.body || {};
	if (!candidate || typeof candidate !== "string") {
		return res.status(400).json({ error: "candidate (string) is required" });
	}
	results.set(candidate, (results.get(candidate) || 0) + 1);
	return res.json({ ok: true, candidate, total: results.get(candidate) });
});

app.get("/results", (req, res) => {
	const obj = Object.fromEntries(results);
	return res.json(obj);
});

app.get("/", (req, res) => {
	res.send("Online Voting System Backend Running 🚀");
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});


