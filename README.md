# 🚗 V2V Communication System

A prototype system demonstrating **Vehicle-to-Vehicle (V2V) Communication** using a combination of:
- **C-based low-level data simulator** for CAN-like message transfer
- **Node.js backend** to handle message routing and validation
- **Web-based dashboard** for visualization of vehicle data and alerts

---

## 🧠 Overview

This system simulates how vehicles exchange data such as **speed**, **location**, and **hazard alerts** over a common network to enhance **road safety** and **autonomous coordination**.

---

## 🧩 Project Components

### 1. Simulator (C)
- Generates simulated data packets (speed, location, vehicle ID)
- Uses socket communication to send data to the Node.js API
- Emulates the CAN (Controller Area Network) behavior at small scale

### 2. Node.js API
- Acts as the **message relay server**
- Receives vehicle data, validates packet integrity, and stores logs
- Broadcasts warnings to other nearby vehicles via HTTP or WebSocket

### 3. Frontend (Dashboard)
- Displays all connected vehicles on a map (or table)
- Shows live status updates (speed, alerts)
- Provides visualization for “collision warning” or “hazard detected”

---

## ⚙️ Working

1. Each simulated vehicle sends packets like:
