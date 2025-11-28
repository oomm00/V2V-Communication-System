from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = "v2v_secret_key"

# Configuration
NODE_API_URL = "http://127.0.0.1:5000"

def fetch_alerts():
    """Fetch alerts from the Node.js API."""
    try:
        r = requests.get(f"{NODE_API_URL}/alerts", timeout=5)
        r.raise_for_status()
        data = r.json()
        return data.get("alerts", [])
    except Exception as e:
        print(f"⚠️ Error fetching alerts: {e}")
        return []

def fetch_metrics():
    """Fetch metrics from the Node.js API."""
    try:
        r = requests.get(f"{NODE_API_URL}/metrics", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"⚠️ Error fetching metrics: {e}")
        return {
            "messages_per_sec": 0,
            "rejected_count": 0,
            "active_nodes": 0,
            "tentative_alerts": 0,
            "verified_alerts": 0
        }

@app.route("/")
def dashboard():
    """Dashboard: Shows alerts and metrics."""
    alerts = fetch_alerts()
    metrics = fetch_metrics()

    # Format alerts for display
    for alert in alerts:
        # Convert Unix timestamp to readable format
        if alert.get("verified_at"):
            timestamp = datetime.fromtimestamp(alert["verified_at"] / 1000)
            alert["formatted_time"] = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        else:
            alert["formatted_time"] = "N/A"

    return render_template(
        "dashboard.html",
        alerts=alerts,
        metrics=metrics
    )

@app.route("/report", methods=["GET", "POST"])
def report_hazard():
    """Report a new hazard."""
    if request.method == "POST":
        data = {
            "hazard_type": request.form.get("hazard_type"),
            "location": [float(request.form.get("lat")), float(request.form.get("lon"))],
            "confidence": float(request.form.get("confidence")),
        }

        try:
            r = requests.post(f"{NODE_API_URL}/report", json=data, timeout=5)
            r.raise_for_status()
            flash("✅ Hazard reported successfully!", "success")
            return redirect(url_for("dashboard"))
        except Exception as e:
            flash(f"⚠️ Error reporting hazard: {e}", "danger")

    return render_template("report.html")

@app.route("/api/alerts")
def api_alerts():
    """API endpoint for AJAX polling."""
    alerts = fetch_alerts()
    return jsonify({"alerts": alerts, "timestamp": datetime.now().isoformat()})

@app.route("/api/metrics")
def api_metrics():
    """API endpoint for metrics."""
    metrics = fetch_metrics()
    return jsonify(metrics)

if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")
