import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BatterySpecs } from '../utils/battery-sim';
import type { SolarSystemSpecs, Location } from '../utils/solar-sim';

// Device Definition
export interface Device {
    id: string;
    name: string;
    powerWatts: number;
    requiresDeviceId?: string; // ID of another device that must be ON
}

// Preset Definition
export interface Preset {
    id: string;
    name: string;
    enabledScheduleIds: string[];
}

// Schedule Definition
export interface Schedule {
    id: string;
    name: string;
    deviceIds: string[]; // List of Device IDs in this schedule
    activeSlots: boolean[]; // 7 days * 96 intervals (15 min) = 672 slots
    enabled: boolean;
    color: string;
}

interface SystemState {
    batterySpecs: BatterySpecs;
    solarSpecs: SolarSystemSpecs;
    location: Location;
    devices: Device[];
    schedules: Schedule[];
    presets: Preset[];
    simulationDate: Date; // The start date
    simulationDays: number; // 1, 7, or 30
}

interface SystemContextType extends SystemState {
    setBatterySpecs: (specs: BatterySpecs) => void;
    setSolarSpecs: (specs: SolarSystemSpecs) => void;
    setLocation: (loc: Location) => void;
    addDevice: (device: Device) => void;
    updateDevice: (device: Device) => void;
    removeDevice: (id: string) => void;
    addSchedule: (schedule: Schedule) => void;
    updateSchedule: (schedule: Schedule) => void;
    removeSchedule: (id: string) => void;
    savePreset: (name: string) => void;
    applyPreset: (id: string) => void;
    removePreset: (id: string) => void;
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
    const [devices, setDevices] = useState<Device[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [simulationDate, setSimulationDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [simulationDays, setSimulationDays] = useState<number>(1);
    const [useLiveWeather, setUseLiveWeather] = useState<boolean>(false);

    const addDevice = (device: Device) => setDevices(prev => [...prev, device]);
    const updateDevice = (updated: Device) => setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    const removeDevice = (id: string) => {
        setDevices(prev => prev.filter(d => d.id !== id));
        // Also remove from all schedules
        setSchedules(prev => prev.map(s => ({
            ...s,
            deviceIds: s.deviceIds.filter(dId => dId !== id)
        })));
    };

    const addSchedule = (schedule: Schedule) => setSchedules(prev => [...prev, schedule]);
    const updateSchedule = (updated: Schedule) => setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    const removeSchedule = (id: string) => setSchedules(prev => prev.filter(s => s.id !== id));

    const savePreset = (name: string) => {
        const newPreset: Preset = {
            id: crypto.randomUUID(),
            name,
            enabledScheduleIds: schedules.filter(s => s.enabled).map(s => s.id)
        };
        setPresets(prev => [...prev, newPreset]);
    };

    const applyPreset = (id: string) => {
        const preset = presets.find(p => p.id === id);
        if (!preset) return;
        setSchedules(prev => prev.map(s => ({
            ...s,
            enabled: preset.enabledScheduleIds.includes(s.id)
        })));
    };

    const removePreset = (id: string) => setPresets(prev => prev.filter(p => p.id !== id));

    const importSystemData = (data: any) => {
        if (!data) return;

        if (data.batterySpecs) {
            const b = data.batterySpecs;
            if (b.voltage === undefined) b.voltage = 48;
            if (b.ampHours === undefined) b.ampHours = Math.round((b.capacityKwh * 1000) / b.voltage);
            setBatterySpecs(b);
        }
        if (data.solarSpecs) setSolarSpecs(data.solarSpecs);
        if (data.location) setLocation(data.location);

        // Handle Migration from old "loads" model to new "devices/schedules" model
        // We migrate if "loads" is present AND we don't have existing devices/schedules in the incoming data
        if (data.loads && (!data.devices || data.devices.length === 0)) {
            const migratedDevices: Device[] = [];
            const migratedSchedules: Schedule[] = [];

            data.loads.forEach((load: any) => {
                const deviceId = load.id || crypto.randomUUID();
                migratedDevices.push({
                    id: deviceId,
                    name: load.name,
                    powerWatts: load.powerWatts
                });
                migratedSchedules.push({
                    id: crypto.randomUUID(),
                    name: load.name,
                    deviceIds: [deviceId],
                    activeSlots: load.schedule?.activeSlots || new Array(672).fill(false),
                    enabled: load.enabled !== undefined ? load.enabled : true,
                    color: load.color || `hsl(${Math.random() * 360}, 70%, 50%)`
                });
            });
            setDevices(migratedDevices);
            setSchedules(migratedSchedules);
        } else {
            if (data.devices) setDevices(data.devices);
            if (data.schedules) setSchedules(data.schedules);
            if (data.presets) setPresets(data.presets);
        }

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
            devices, addDevice, updateDevice, removeDevice,
            schedules, addSchedule, updateSchedule, removeSchedule,
            presets, savePreset, applyPreset, removePreset,
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
