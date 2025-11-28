#!/usr/bin/env python3
"""
V2V Simple Simulator - Sends hazard alerts to the V2V API
No signature verification (development mode)
"""

import requests
import time
import random
import json
from datetime import datetime

API_URL = "http://127.0.0.1:8082"

# Simulated hazard types
HAZARD_TYPES = [
    "road_block", "ice_patch", "accident", "debris",
    "construction", "weather_hazard", "animal_crossing"
]

def generate_alert(vehicle_id, sequence):
    """Generate a random hazard alert"""
    hazard_type = random.choice(HAZARD_TYPES)
    
    # Simulate location around NYC
    base_lat = 40.7128
    base_lng = -74.0060
    
    location = [
        base_lat + random.uniform(-0.5, 0.5),
        base_lng + random.uniform(-0.5, 0.5)
    ]
    
    confidence = round(random.uniform(0.7, 0.95), 2)
    
    alert = {
        "msg_type": "hazard_report",
        "ephemeral_id": vehicle_id,
        "location": location,
        "hazard_type": hazard_type,
        "confidence": confidence,
        "seq": sequence,
        "timestamp": int(time.time() * 1000),
        "signature": "dev_mode_no_signature"  # Development mode
    }
    
    return alert

def send_alert(alert):
    """Send alert to API"""
    try:
        response = requests.post(
            f"{API_URL}/alert",
            json=alert,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            timestamp = datetime.now().strftime('%H:%M:%S')
            hazard = alert['hazard_type']
            lat = alert['location'][0]
            lon = alert['location'][1]
            print(f"✅ [{timestamp}] Alert sent: {hazard} at ({lat:.4f}, {lon:.4f})")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {API_URL}")
        print(f"   Make sure the backend is running!")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    import sys
    
    # Get vehicle ID from command line or use default
    vehicle_id = sys.argv[1] if len(sys.argv) > 1 else "car1"
    
    print("🚗 V2V Simple Simulator Starting...")
    print(f"   Vehicle ID: {vehicle_id}")
    print(f"   API URL: {API_URL}")
    print(f"   Hazard Types: {', '.join(HAZARD_TYPES)}")
    print("   Press Ctrl+C to stop\n")
    
    # Test connection first
    try:
        response = requests.get(f"{API_URL}/", timeout=3)
        print(f"✅ Backend is reachable\n")
    except:
        print(f"❌ Cannot reach backend at {API_URL}")
        print(f"   Please start the backend first with: .\\RUN.ps1\n")
        return
    
    sequence = 0
    interval = 3  # seconds between alerts
    
    try:
        while True:
            sequence += 1
            alert = generate_alert(vehicle_id, sequence)
            send_alert(alert)
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\n👋 Simulator stopped")
        print(f"   Sent {sequence} alerts total")

if __name__ == "__main__":
    main()
