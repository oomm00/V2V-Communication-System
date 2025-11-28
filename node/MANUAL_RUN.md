# Manual Run Instructions

## ✅ Use PowerShell (NOT MSYS/MINGW)

Open PowerShell and run these commands:

### Option 1: Easy Way (Recommended)
```powershell
cd D:\v2v\node
.\START_HERE.ps1
```

### Option 2: Manual Step-by-Step

**Terminal 1 - Start Server:**
```powershell
cd D:\v2v\node
npm start
```
Wait for: "Server running on http://localhost:5000"

**Terminal 2 - Run Simulator:**
```powershell
cd D:\v2v\node
npm run sim
```

### Option 3: One-Line Commands
```powershell
# In PowerShell, cd to D:\v2v\node first, then:

# Start server (background)
Start-Job -ScriptBlock { cd D:\v2v\node; npm start }

# Wait 3 seconds
Start-Sleep -Seconds 3

# Run simulator
npm run sim
```

## ⚠️ Common Issues

**Issue:** "Usage: node --port..."  
**Fix:** This means it's calling the C node.exe. We fixed this by using the full path in package.json.

**Issue:** "ENOENT package.json"  
**Fix:** Make sure you're in the `D:\v2v\node` directory.

**Issue:** "Cannot find module socket.io"  
**Fix:** Run `npm install` first.

## 📝 What You Should See

**Server Output:**
```
Server running on http://localhost:5000
[socket] client connected xyz123
[registry] saved/updated key for car1
[forward] from car1 @ (40.7128,-74.0060) speed=32.5
```

**Simulator Output:**
```
[sim] connected xyz789
[sim] sent { lat: 40.7128, lng: -74.0060 }
```

