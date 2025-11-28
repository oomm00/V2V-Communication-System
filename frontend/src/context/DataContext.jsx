import { createContext, useContext, useState, useEffect } from 'react';
import socketManager from '../socket';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

// Real Uttarakhand coordinate generator
const generateCoordinates = () => {
  const uttarakhandLocations = [
    { name: 'ISBT Dehradun', lat: 30.290996, lng: 78.044090 },
    { name: 'Rajpur Road', lat: 30.364548, lng: 78.078404 },
    { name: 'Pacific Mall', lat: 30.301987, lng: 78.006676 },
    { name: 'Clock Tower', lat: 30.325470, lng: 78.043735 },
    { name: 'Jolly Grant Airport', lat: 30.176682, lng: 78.184040 },
    { name: 'Prem Nagar', lat: 30.308750, lng: 77.981560 },
    { name: 'Mussoorie Road', lat: 30.456789, lng: 78.067890 },
    { name: 'Sahastradhara Road', lat: 30.365432, lng: 78.123456 },
    { name: 'Ballupur', lat: 30.345678, lng: 78.056789 },
    { name: 'Clement Town', lat: 30.267890, lng: 78.012345 }
  ];
  const location = uttarakhandLocations[Math.floor(Math.random() * uttarakhandLocations.length)];
  return {
    lat: location.lat + (Math.random() - 0.5) * 0.005,
    lng: location.lng + (Math.random() - 0.5) * 0.005,
    location: location.name
  };
};

export const DataProvider = ({ children }) => {
  // EDSCA State
  const [edscaEnabled, setEdscaEnabled] = useState(true);
  
  // Alerts State with Uttarakhand coordinates
  const [alerts, setAlerts] = useState(() => {
    const loc1 = generateCoordinates();
    const loc2 = generateCoordinates();
    const loc3 = generateCoordinates();
    const loc4 = generateCoordinates();
    
    return [
      {
        id: 1,
        type: 'Road Block',
        severity: 'high',
        location: loc1.location,
        vehicle: 'VEH-001',
        timestamp: new Date().toISOString(),
        lat: loc1.lat,
        lng: loc1.lng,
        encrypted: true,
        decrypted: false,
        blockchainTxId: null
      },
      {
        id: 2,
        type: 'Accident',
        severity: 'critical',
        location: loc2.location,
        vehicle: 'VEH-003',
        timestamp: new Date().toISOString(),
        lat: loc2.lat,
        lng: loc2.lng,
        encrypted: true,
        decrypted: false,
        blockchainTxId: null
      },
      {
        id: 3,
        type: 'Ice Patch',
        severity: 'medium',
        location: loc3.location,
        vehicle: 'VEH-007',
        timestamp: new Date().toISOString(),
        lat: loc3.lat,
        lng: loc3.lng,
        encrypted: true,
        decrypted: false,
        blockchainTxId: null
      },
      {
        id: 4,
        type: 'Heavy Traffic',
        severity: 'low',
        location: loc4.location,
        vehicle: 'VEH-012',
        timestamp: new Date().toISOString(),
        lat: loc4.lat,
        lng: loc4.lng,
        encrypted: true,
        decrypted: false,
        blockchainTxId: null
      }
    ];
  });

  // Vehicles State with Uttarakhand locations
  const [vehicles, setVehicles] = useState(() => {
    const vLoc1 = generateCoordinates();
    const vLoc2 = generateCoordinates();
    const vLoc3 = generateCoordinates();
    const vLoc4 = generateCoordinates();
    const vLoc5 = generateCoordinates();
    const vLoc6 = generateCoordinates();
    
    return [
      {
        id: 'VEH-001',
        status: 'active',
        location: vLoc1.location,
        speed: 65,
        lat: vLoc1.lat,
        lng: vLoc1.lng,
        lastSeen: new Date()
      },
      {
        id: 'VEH-003',
        status: 'active',
        location: vLoc2.location,
        speed: 45,
        lat: vLoc2.lat,
        lng: vLoc2.lng,
        lastSeen: new Date()
      },
      {
        id: 'VEH-007',
        status: 'active',
        location: vLoc3.location,
        speed: 80,
        lat: vLoc3.lat,
        lng: vLoc3.lng,
        lastSeen: new Date()
      },
      {
        id: 'VEH-012',
        status: 'active',
        location: vLoc4.location,
        speed: 30,
        lat: vLoc4.lat,
        lng: vLoc4.lng,
        lastSeen: new Date()
      },
      {
        id: 'VEH-015',
        status: 'idle',
        location: vLoc5.location,
        speed: 0,
        lat: vLoc5.lat,
        lng: vLoc5.lng,
        lastSeen: new Date(Date.now() - 120000)
      },
      {
        id: 'VEH-018',
        status: 'active',
        location: vLoc6.location,
        speed: 95,
        lat: vLoc6.lat,
        lng: vLoc6.lng,
        lastSeen: new Date()
      }
    ];
  });

  // Blockchain Logs State
  const [blockchainLogs, setBlockchainLogs] = useState([
    {
      id: 1,
      txId: '0x7f9a3d2e',
      alertId: 1,
      timestamp: new Date(Date.now() - 2000).toISOString(),
      status: 'confirmed',
      blockNumber: 15847
    },
    {
      id: 2,
      txId: '0x4c1b8a9f',
      alertId: 2,
      timestamp: new Date(Date.now() - 15000).toISOString(),
      status: 'confirmed',
      blockNumber: 15846
    },
    {
      id: 3,
      txId: '0x9e2d5c7a',
      alertId: 3,
      timestamp: new Date(Date.now() - 28000).toISOString(),
      status: 'confirmed',
      blockNumber: 15845
    }
  ]);

  // Stats State
  const [stats, setStats] = useState({
    totalAlerts: 4,
    activeVehicles: 5,
    messagesPerSecond: 8.5,
    networkHealth: 94,
    blockchainLogs: 3,
    latestBlock: 15847
  });

  // Add Alert Function
  const addAlert = (newAlert) => {
    const coords = generateCoordinates();
    const alert = {
      id: Date.now(),
      ...newAlert,
      lat: coords.lat,
      lng: coords.lng,
      location: newAlert.location || coords.location,
      timestamp: new Date().toISOString(),
      encrypted: edscaEnabled,
      decrypted: false,
      blockchainTxId: null
    };
    
    console.log('Adding alert with coordinates:', alert);
    
    setAlerts(prev => [alert, ...prev]);
    
    // Auto-create blockchain log
    setTimeout(() => {
      createBlockchainLog(alert.id);
    }, 500);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalAlerts: prev.totalAlerts + 1
    }));
  };

  // Delete Alert Function
  const deleteAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    setStats(prev => ({
      ...prev,
      totalAlerts: prev.totalAlerts - 1
    }));
  };

  // Create Blockchain Log
  const createBlockchainLog = (alertId) => {
    const txId = `0x${Math.random().toString(16).substr(2, 8)}`;
    const log = {
      id: Date.now(),
      txId,
      alertId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      blockNumber: null
    };
    
    setBlockchainLogs(prev => [log, ...prev]);
    
    // Update alert with txId
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, blockchainTxId: txId } : alert
    ));
    
    // Simulate confirmation after 3 seconds
    setTimeout(() => {
      confirmBlockchainLog(log.id);
    }, 3000);
    
    setStats(prev => ({
      ...prev,
      blockchainLogs: prev.blockchainLogs + 1,
      latestBlock: prev.latestBlock + 1
    }));
  };

  // Confirm Blockchain Log
  const confirmBlockchainLog = (logId) => {
    setBlockchainLogs(prev => prev.map(log =>
      log.id === logId
        ? { ...log, status: 'confirmed', blockNumber: stats.latestBlock }
        : log
    ));
  };

  // Decrypt Alert
  const decryptAlert = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, decrypted: true } : alert
    ));
  };

  // Update vehicle positions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(vehicle => {
        if (vehicle.status === 'active') {
          const coords = generateCoordinates();
          return {
            ...vehicle,
            ...coords,
            speed: Math.floor(Math.random() * 100),
            lastSeen: new Date()
          };
        }
        return vehicle;
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Update stats
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalAlerts: alerts.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      blockchainLogs: blockchainLogs.length
    }));
  }, [alerts.length, vehicles, blockchainLogs.length]);

  // Connect to backend WebSocket
  useEffect(() => {
    console.log('🔌 Connecting to backend...');
    socketManager.connect();

    // Listen for new alerts from backend
    const handleNewAlert = (alertData) => {
      console.log('📥 Received alert from backend:', alertData);
      
      // Transform backend alert to our format
      const coords = alertData.latitude && alertData.longitude 
        ? { lat: alertData.latitude, lng: alertData.longitude }
        : generateCoordinates();
      
      // Determine severity based on confidence
      let severity = 'low';
      if (alertData.confidence >= 90) severity = 'critical';
      else if (alertData.confidence >= 75) severity = 'high';
      else if (alertData.confidence >= 50) severity = 'medium';
      
      const alert = {
        id: alertData.alert_key || Date.now(),
        type: (alertData.hazard_type || 'Unknown').replace(/_/g, ' '),
        severity: severity,
        location: alertData.location_name || alertData.location || coords.location || 'Unknown Location',
        vehicle: alertData.ephemeral_id || 'Unknown',
        timestamp: alertData.timestamp || new Date().toISOString(),
        lat: coords.lat,
        lng: coords.lng,
        encrypted: edscaEnabled,
        decrypted: false,
        blockchainTxId: alertData.blockchain_tx || null
      };
      
      setAlerts(prev => [alert, ...prev]);
      
      // If blockchain tx already exists, add it to logs
      if (alertData.blockchain_tx) {
        const log = {
          id: Date.now(),
          txId: alertData.blockchain_tx,
          alertId: alert.id,
          timestamp: new Date().toISOString(),
          status: 'confirmed',
          blockNumber: alertData.blockchain_hazard_id || stats.latestBlock
        };
        setBlockchainLogs(prev => [log, ...prev]);
      } else {
        // Auto-create blockchain log if not present
        setTimeout(() => {
          createBlockchainLog(alert.id);
        }, 500);
      }
    };

    socketManager.on('new_alert', handleNewAlert);

    // Cleanup on unmount
    return () => {
      socketManager.off('new_alert', handleNewAlert);
      socketManager.disconnect();
    };
  }, [edscaEnabled]);

  const value = {
    // State
    alerts,
    vehicles,
    blockchainLogs,
    stats,
    edscaEnabled,
    
    // Actions
    addAlert,
    deleteAlert,
    decryptAlert,
    setEdscaEnabled,
    createBlockchainLog
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
