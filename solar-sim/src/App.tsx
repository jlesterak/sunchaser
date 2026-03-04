import { SystemProvider } from './context/SystemContext';
import { ConfigPanel } from './components/ConfigPanel';
import { DeviceManager } from './components/DeviceManager';
import { ScheduleManager } from './components/ScheduleManager';
import { LocationDatePanel } from './components/LocationDatePanel';
import { Dashboard } from './components/Dashboard';
import { PresetManager } from './components/PresetManager';

import { useState } from 'react';
import { Settings, Activity, Cpu, CalendarClock } from 'lucide-react';

type Tab = 'dashboard' | 'setup' | 'devices' | 'schedule';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <div className="space-y-8 animate-in fade-in duration-300 pb-24 lg:pb-8">
            <ConfigPanel />
            <PresetManager />
            <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold text-lg mb-2 text-zinc-300">Tips</h3>
              <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                <li>Adjust battery size to cover night-time usage.</li>
                <li>Increase solar array to ensure full charge by evening.</li>
                <li>Use the Scheduler to shift loads to sunny hours.</li>
              </ul>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-300 pb-24 lg:pb-8">
            <LocationDatePanel />
            <Dashboard />
          </div>
        );
      case 'devices':
        return (
          <div className="space-y-8 animate-in fade-in duration-300 pb-24 lg:pb-8">
            <DeviceManager />
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-8 animate-in fade-in duration-300 pb-24 lg:pb-8">
            <ScheduleManager />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <header className="p-4 lg:p-8 shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl lg:text-3xl font-bold tracking-tight text-blue-400">Solar Estimator</h1>
          <p className="text-zinc-400 mt-1 text-sm lg:text-base hidden sm:block">Plan your power system, schedule loads, and visualize performance.</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 pt-0">
        {renderTabContent()}
      </main>

      {/* Mobile / Desktop Bottom-ish Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50 lg:sticky lg:bottom-4 lg:mx-auto lg:max-w-md lg:rounded-2xl lg:border lg:mb-4 pt-1 pb-1 px-2">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<Activity size={24} />}
            label="Dashboard"
          />
          <TabButton
            active={activeTab === 'setup'}
            onClick={() => setActiveTab('setup')}
            icon={<Settings size={24} />}
            label="Setup"
          />
          <TabButton
            active={activeTab === 'devices'}
            onClick={() => setActiveTab('devices')}
            icon={<Cpu size={24} />}
            label="Devices"
          />
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            icon={<CalendarClock size={24} />}
            label="Schedule"
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-colors ${active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
    >
      <div className={`mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
    </button>
  );
}

function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}

export default App;
