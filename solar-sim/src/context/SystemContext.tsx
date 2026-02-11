import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BatterySpecs } from '../utils/battery-sim';
import type { SolarSystemSpecs, Location } from '../utils/solar-sim';

// Load Definition
export interface LoadSchedule {
    // 7 days * 96 intervals (15 min) = 672 slots
    // true = on, false = off
    activeSlots: boolean[];
}

export interface Load {
    id: string;
    name: string;
    powerWatts: number;
    schedule: LoadSchedule;
    color: string; // For UI visualization
}

interface SystemState {
    batterySpecs: BatterySpecs;
    solarSpecs: SolarSystemSpecs;
    location: Location;
    loads: Load[];
    simulationDate: Date; // The start date
    simulationDays: number; // 1, 7, or 30
}

interface SystemContextType extends SystemState {
    setBatterySpecs: (specs: BatterySpecs) => void;
    setSolarSpecs: (specs: SolarSystemSpecs) => void;
    setLocation: (loc: Location) => void;
    addLoad: (load: Load) => void;
    updateLoad: (load: Load) => void;
    removeLoad: (id: string) => void;
    setSimulationDate: (date: Date) => void;
    setSimulationDays: (days: number) => void;
    useLiveWeather: boolean;
    setUseLiveWeather: (use: boolean) => void;
    importSystemData: (data: any) => void;
}

const defaultBattery: BatterySpecs = {
    capacityKwh: 10,
    voltage: 48,
    ampHours: 208,
    efficiency: 0.95,
    maxChargeRateKw: 5,
    maxDischargeRateKw: 5,
    initialSoC: 0.5,
};

const defaultSolar: SolarSystemSpecs = {
    arraySizeKw: 5,
    systemEfficiency: 0.85,
    tiltAngle: 30,
    azimuth: 180,
};

const defaultLocation: Location = {
    latitude: 34.05, // Los Angeles
    longitude: -118.25,
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
    const [batterySpecs, setBatterySpecs] = useState<BatterySpecs>(defaultBattery);
    const [solarSpecs, setSolarSpecs] = useState<SolarSystemSpecs>(defaultSolar);
    const [location, setLocation] = useState<Location>(defaultLocation);
    const [loads, setLoads] = useState<Load[]>([]);
    const [simulationDate, setSimulationDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [simulationDays, setSimulationDays] = useState<number>(1);
    const [useLiveWeather, setUseLiveWeather] = useState<boolean>(false);

    const addLoad = (load: Load) => setLoads(prev => [...prev, load]);
    const updateLoad = (updated: Load) => setLoads(prev => prev.map(l => l.id === updated.id ? updated : l));
    const removeLoad = (id: string) => setLoads(prev => prev.filter(l => l.id !== id));

    const importSystemData = (data: any) => {
        if (data.batterySpecs) {
            const b = data.batterySpecs;
            // Handle migration or missing fields
            if (b.voltage === undefined) b.voltage = 48;
            if (b.ampHours === undefined) b.ampHours = Math.round((b.capacityKwh * 1000) / b.voltage);
            setBatterySpecs(b);
        }
        if (data.solarSpecs) setSolarSpecs(data.solarSpecs);
        if (data.location) setLocation(data.location);
        if (data.loads) setLoads(data.loads);
        if (data.simulationDate) setSimulationDate(new Date(data.simulationDate));
        if (data.simulationDays) setSimulationDays(data.simulationDays);
        if (data.useLiveWeather !== undefined) setUseLiveWeather(data.useLiveWeather);
    };

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('solar-sim-config');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                importSystemData(data);
            } catch (err) {
                console.error("Failed to load saved config from local storage", err);
            }
        }
    }, []);

    return (
        <SystemContext.Provider value={{
            batterySpecs, setBatterySpecs,
            solarSpecs, setSolarSpecs,
            location, setLocation,
            loads, addLoad, updateLoad, removeLoad,
            simulationDate, setSimulationDate,
            simulationDays, setSimulationDays,
            useLiveWeather, setUseLiveWeather,
            importSystemData
        }}>
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (!context) throw new Error('useSystem must be used within SystemProvider');
    return context;
}
