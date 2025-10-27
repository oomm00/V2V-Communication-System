from flask import Flask, render_template, request, redirect, url_for, flash
import requests

app = Flask(__name__)
app.secret_key = "v2v_secret_key"

# --- Configuration ---
NODE_API_URL = "http://127.0.0.1:9001"  # Mock backend URL


# --- Helper Functions ---
def fetch_alerts():
    """Fetch mock alerts from the node API."""
    try:
        r = requests.get(f"{NODE_API_URL}/alerts", timeout=5)
        r.raise_for_status()
        data = r.json()
        # Extract list safely (fixes the AttributeError)
        return data.get("alerts", [])
    except Exception as e:
        print("⚠️ Error fetching alerts:", e)
        return []


def fetch_metrics():
    """Fetch mock metrics for dashboard cards."""
    try:
        r = requests.get(f"{NODE_API_URL}/metrics", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("⚠️ Error fetching metrics:", e)
        return {
            "messages_per_sec": 0,
            "rejected_count": 0,
            "active_nodes": 0,
            "tentative_alerts": 0,
            "verified_alerts": 0
        }


# --- Routes ---
@app.route("/")
def dashboard():
    """Dashboard: Shows alerts and metrics."""
    alerts = fetch_alerts()
    metrics = fetch_metrics()

    # Separate alerts by status
    tentative = [a for a in alerts if a.get("status") == "TENTATIVE"]
    verified = [a for a in alerts if a.get("status") == "VERIFIED"]

    return render_template(
        "dashboard.html",
        tentative=tentative,
        verified=verified,
        metrics=metrics
    )


@app.route("/report", methods=["GET", "POST"])
def report_hazard():
    """Report a new hazard (mock submission)."""
    if request.method == "POST":
        data = {
            "hazard_type": request.form.get("hazard_type"),
            "location": [float(request.form.get("lat")), float(request.form.get("lon"))],
            "confidence": float(request.form.get("confidence")),
            "ttl_seconds": int(request.form.get("ttl_seconds")),
        }

        try:
            r = requests.post(f"{NODE_API_URL}/report", json=data, timeout=5)
            r.raise_for_status()
            flash("✅ Hazard reported successfully!", "success")
            return redirect(url_for("dashboard"))
        except Exception as e:
            flash(f"⚠️ Error reporting hazard: {e}", "danger")

    return render_template("report.html")


@app.route("/clear", methods=["POST"])
def clear_alert():
    """Clear an existing alert by alert_key."""
    key = request.form.get("alert_key")
    try:
        r = requests.post(f"{NODE_API_URL}/clear", json={"alert_key": key}, timeout=5)
        r.raise_for_status()
        flash("✅ Alert cleared successfully!", "success")
    except Exception as e:
        flash(f"⚠️ Error clearing alert: {e}", "danger")
    return redirect(url_for("dashboard"))


# --- Run the App ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)
