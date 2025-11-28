#!/usr/bin/env python3
"""
V2V Simulator - Sends hazard alerts to the V2V API with ECDSA signatures
"""

import requests
import time
import random
import json
import hashlib
import base64
import os
from datetime import datetime
from ecdsa import SigningKey, SECP256k1
API_URL = "http://127.0.0.1:8082" 


# Simulated hazard types
HAZARD_TYPES = [
    "road_block", "ice_patch", "accident", "debris",
    "construction", "weather_hazard", "animal_crossing"
]

class V2VSimulator:
    def __init__(self, vehicle_id="car1"):
        self.vehicle_id = vehicle_id
        self.private_key = None
        self.public_key = None
        self.sequence = 0
        self.keys_dir = os.path.join(os.path.dirname(__file__), "..", "keys")
        
        # Ensure keys directory exists
        os.makedirs(self.keys_dir, exist_ok=True)
        
        # Load or generate keys
        self.load_or_generate_keys()
        
    def load_or_generate_keys(self):
        """Load existing keys or generate new ones"""
        priv_key_path = os.path.join(self.keys_dir, f"{self.vehicle_id}_priv.pem")
        pub_key_path = os.path.join(self.keys_dir, f"{self.vehicle_id}_pub.pem")
        
        if os.path.exists(priv_key_path):
            # Load existing private key
            with open(priv_key_path, 'r') as f:
                self.private_key = SigningKey.from_pem(f.read())
            print(f"[keys] Loaded existing key for {self.vehicle_id}")
        else:
            # Generate new key pair
            self.private_key = SigningKey.generate(curve=SECP256k1)
            
            # Save private key
            with open(priv_key_path, 'w') as f:
                f.write(self.private_key.to_pem().decode('utf-8'))
            
            print(f"[keys] Generated new key for {self.vehicle_id}")
        
        # Get public key
        self.public_key = self.private_key.get_verifying_key()
        
        # Save public key
        with open(pub_key_path, 'w') as f:
            f.write(self.public_key.to_pem().decode('utf-8'))
        
        # Register public key in registry
        self.register_public_key()
    
    def register_public_key(self):
        """Register public key in publicKeys.json"""
        registry_path = os.path.join(self.keys_dir, "publicKeys.json")
        
        # Load existing registry
        if os.path.exists(registry_path):
            with open(registry_path, 'r') as f:
                registry = json.load(f)
        else:
            registry = {}
        
        # Add/update this vehicle's public key
        public_key_hex = self.public_key.to_string().hex()
        registry[self.vehicle_id] = {
            "publicKey": public_key_hex,
            "format": "hex",
            "curve": "secp256k1",
            "registered": datetime.now().isoformat()
        }
        
        # Save registry
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        
        print(f"[keys] Registered public key for {self.vehicle_id}")
    
    def create_canonical_message(self, alert):
        """Create canonical message for signing"""
        canonical = {
            "msg_type": alert["msg_type"],
            "ephemeral_id": alert["ephemeral_id"],
            "location": alert["location"],
            "hazard_type": alert["hazard_type"],
            "confidence": alert["confidence"]
        }
        # Sort keys for deterministic output
        return json.dumps(canonical, sort_keys=True)
    
    def sign_message(self, message):
        """Sign message with ECDSA"""
        # Compute SHA-256 hash
        msg_hash = hashlib.sha256(message.encode('utf-8')).digest()
        
        # Sign the hash
        signature = self.private_key.sign_digest(msg_hash, sigencode=lambda r, s, order: r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))
        
        # Base64 encode for transmission
        signature_b64 = base64.b64encode(signature).decode('utf-8')
        
        return signature_b64

    def generate_alert(self):
        """Generate a random hazard alert with signature"""
        hazard_type = random.choice(HAZARD_TYPES)
        
        # Real Uttarakhand, India locations (Dehradun area)
        UTTARAKHAND_LOCATIONS = [
            {"name": "ISBT Dehradun", "lat": 30.290996, "lng": 78.044090},
            {"name": "Rajpur Road", "lat": 30.364548, "lng": 78.078404},
            {"name": "Pacific Mall", "lat": 30.301987, "lng": 78.006676},
            {"name": "Clock Tower", "lat": 30.325470, "lng": 78.043735},
            {"name": "Jolly Grant Airport", "lat": 30.176682, "lng": 78.184040},
            {"name": "Prem Nagar", "lat": 30.308750, "lng": 77.981560},
            {"name": "Mussoorie Road", "lat": 30.456789, "lng": 78.067890},
            {"name": "Sahastradhara Road", "lat": 30.365432, "lng": 78.123456},
            {"name": "Ballupur", "lat": 30.345678, "lng": 78.056789},
            {"name": "Clement Town", "lat": 30.267890, "lng": 78.012345}
        ]
        
        # Pick a random location
        loc = random.choice(UTTARAKHAND_LOCATIONS)
        
        # Add small random offset for variety (±0.005 degrees ≈ ±500m)
        latitude = loc["lat"] + random.uniform(-0.005, 0.005)
        longitude = loc["lng"] + random.uniform(-0.005, 0.005)
        location_name = loc["name"]
        
        location = [latitude, longitude]
        
        confidence = round(random.uniform(0.7, 0.95), 2)
        
        # Increment sequence number
        self.sequence += 1
        
        # Create alert (without signature first)
        alert = {
            "msg_type": "hazard_report",
            "ephemeral_id": self.vehicle_id,
            "location": location,
            "location_name": location_name,
            "latitude": latitude,
            "longitude": longitude,
            "hazard_type": hazard_type,
            "confidence": confidence,
            "seq": self.sequence,
            "timestamp": int(time.time() * 1000)
        }
        
        # Create canonical message and sign it
        canonical = self.create_canonical_message(alert)
        signature = self.sign_message(canonical)
        
        # Add signature to alert
        alert["signature"] = signature
        
        return alert

  # ✅ base URL only

def send_alert(alert):
    """Send alert to API"""
    try:
        response = requests.post(
            f"{API_URL}/alert",   # ✅ this adds /alert once
            json=alert,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] Alert sent: {result.get('alert_key')}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False


def main():
    import sys
    
    # Get vehicle ID from command line or use default
    vehicle_id = sys.argv[1] if len(sys.argv) > 1 else "car1"
    
    print("🚗 V2V Simulator Starting...")
    print(f"   Vehicle ID: {vehicle_id}")
    print(f"   API URL: {API_URL}")
    print(f"   Hazard Types: {', '.join(HAZARD_TYPES)}")
    print("   Press Ctrl+C to stop\n")
    
    # Initialize simulator with ECDSA keys
    simulator = V2VSimulator(vehicle_id)
    
    interval = 3  # seconds between alerts
    
    try:
        while True:
            alert = simulator.generate_alert()
            send_alert(alert)
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\n👋 Simulator stopped")

if __name__ == "__main__":
    main()

