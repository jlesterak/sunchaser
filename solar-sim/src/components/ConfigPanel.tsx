
import { Battery, Sun, Download, Upload, Save, Check } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { useRef, useState } from 'react';

export const ConfigPanel: React.FC = () => {
    const {
        batterySpecs, setBatterySpecs,
        solarSpecs, setSolarSpecs,
        useLiveWeather, setUseLiveWeather,
        location, devices, schedules, simulationDate, simulationDays,
        importSystemData,
    } = useSystem();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);

    const handleBatteryChange = (key: keyof typeof batterySpecs, value: number) => {
        let newSpecs = { ...batterySpecs, [key]: value };

        // Synchronize fields
        if (key === 'voltage' || key === 'ampHours') {
            newSpecs.capacityKwh = (newSpecs.voltage * newSpecs.ampHours) / 1000;
        } else if (key === 'capacityKwh') {
            newSpecs.ampHours = (newSpecs.capacityKwh * 1000) / newSpecs.voltage;
        }

        setBatterySpecs(newSpecs);
    };

    const handleSolarChange = (key: keyof typeof solarSpecs, value: number) => {
        setSolarSpecs({ ...solarSpecs, [key]: value });
    };

    const handleExport = () => {
        const data = {
            batterySpecs,
            solarSpecs,
            location,
            devices,
            schedules,
            simulationDate,
            simulationDays,
            useLiveWeather
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solar-system-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveToBrowser = () => {
        setIsSaving(true);
        const data = {
            batterySpecs,
            solarSpecs,
            location,
            devices,
            schedules,
            simulationDate,
            simulationDays,
            useLiveWeather
        };
        localStorage.setItem('solar-sim-config', JSON.stringify(data));

        setIsSaving(false);
        setShowSavedFeedback(true);
        setTimeout(() => setShowSavedFeedback(false), 3000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                importSystemData(data);
            } catch (err) {
                console.error("Failed to parse system data", err);
                alert("Invalid configuration file.");
            }
        };
        reader.readAsText(file);
        // Clear input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Battery className="text-green-500" />
                System Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Battery Section */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-zinc-300">Battery Bank</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Voltage (V)</label>
                            <input
                                type="number"
                                value={batterySpecs.voltage}
                                onChange={(e) => handleBatteryChange('voltage', parseFloat(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Capacity (Ah)</label>
                            <input
                                type="number"
                                value={batterySpecs.ampHours}
                                onChange={(e) => handleBatteryChange('ampHours', parseFloat(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Total Capacity (kWh)</label>
                        <input
                            type="number"
                            value={batterySpecs.capacityKwh.toFixed(2)}
                            onChange={(e) => handleBatteryChange('capacityKwh', parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Initial Charge (%)</label>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            value={batterySpecs.initialSoC}
                            onChange={(e) => handleBatteryChange('initialSoC', parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-right text-xs text-zinc-500">{(batterySpecs.initialSoC * 100).toFixed(0)}%</div>
                    </div>
                </div>

                {/* Solar Section */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-zinc-300 flex items-center gap-2">
                        <Sun className="text-yellow-500" size={20} />
                        Solar Array
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Array Size (kW)</label>
                            <input
                                type="number"
                                value={solarSpecs.arraySizeKw}
                                onChange={(e) => handleSolarChange('arraySizeKw', parseFloat(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Panel Tilt (°)</label>
                            <input
                                type="number"
                                value={solarSpecs.tiltAngle}
                                onChange={(e) => handleSolarChange('tiltAngle', parseFloat(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Auto: Lat"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">System Efficiency (%)</label>
                        <input
                            type="number"
                            value={solarSpecs.systemEfficiency * 100}
                            onChange={(e) => handleSolarChange('systemEfficiency', (parseFloat(e.target.value) || 0) / 100)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700 mt-4">
                        <label className="text-sm font-medium text-zinc-400">Use Live Weather Forecast</label>
                        <button
                            onClick={() => setUseLiveWeather(!useLiveWeather)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${useLiveWeather ? 'bg-blue-600' : 'bg-zinc-700'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useLiveWeather ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-700 flex gap-4">
                <button
                    onClick={handleExport}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-600"
                >
                    <Download size={18} />
                    Export
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-600"
                >
                    <Upload size={18} />
                    Import
                </button>
                <button
                    onClick={handleSaveToBrowser}
                    disabled={isSaving}
                    className={`flex-[1.5] px-4 py-2 rounded flex items-center justify-center gap-2 transition-all border ${showSavedFeedback
                        ? 'bg-green-600 border-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                        : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }`}
                >
                    {showSavedFeedback ? (
                        <>
                            <Check size={18} className="animate-in zoom-in duration-300" />
                            Saved to Browser!
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save to Browser
                        </>
                    )}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                />
            </div>
        </div>
    );
};
