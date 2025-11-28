import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DataProvider, useData } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VehiclesPage from './components/VehiclesPage';
import AlertsPage from './components/AlertsPage';
import BlockchainPage from './components/BlockchainPage';
import MapPage from './components/MapPage';
import SettingsPage from './components/SettingsPage';
import RightPanel from './components/RightPanel';

function AppContent() {
  const { alerts } = useData();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('Failed to fetch');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
      setConnectionError(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard isConnected={isConnected} connectionError={connectionError} />;
      case 'map':
        return <MapPage />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'blockchain':
        return <BlockchainPage />;
      case 'settings':
        return <SettingsPage isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode(!isDarkMode)} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex transition-colors duration-300`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/20'} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-0 w-96 h-96 ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-500/20'} rounded-full blur-3xl`} />
      </div>

      <div className="relative z-10 flex w-full">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          alertCount={alerts.length}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>

        <RightPanel isConnected={isConnected} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
