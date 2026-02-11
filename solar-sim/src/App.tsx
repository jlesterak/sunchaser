import { SystemProvider } from './context/SystemContext';
import { ConfigPanel } from './components/ConfigPanel';
import { DeviceManager } from './components/DeviceManager';
import { ScheduleManager } from './components/ScheduleManager';
import { LocationDatePanel } from './components/LocationDatePanel';
import { Dashboard } from './components/Dashboard';
import { PresetManager } from './components/PresetManager';

function AppContent() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-blue-400">Off-Grid Solar & Battery Simulator</h1>
        <p className="text-zinc-400 mt-2">Plan your power system, schedule loads, and visualize performance.</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column: Configuration & Controls */}
        <div className="xl:col-span-4 space-y-8">
          <ConfigPanel />
          <DeviceManager />
          <PresetManager />
          <LocationDatePanel />
          <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-lg mb-2 text-zinc-300">Tips</h3>
            <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
              <li>Adjust battery size to cover night-time usage.</li>
              <li>Increase solar array to ensure full charge by evening.</li>
              <li>Use the Scheduler to shift loads to sunny hours.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Visualization & Detailed Load Mgmt */}
        <div className="xl:col-span-8 space-y-8">
          <Dashboard />
          <ScheduleManager />
        </div>

      </main>

      <footer className="text-center text-zinc-600 mt-12 text-sm">
        Solar Estimator v1.0 &middot; Built with React, Vite & Tailwind
      </footer>
    </div>
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
