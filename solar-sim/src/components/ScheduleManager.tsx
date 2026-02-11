import React, { useState, useRef, Fragment } from 'react';
import { useSystem, type Schedule } from '../context/SystemContext';
import { Plus, Trash2, Calendar, Copy, MoreHorizontal, Settings2, Check, X, Smartphone } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const ScheduleManager: React.FC = () => {
    const { schedules, devices, addSchedule, updateSchedule, removeSchedule } = useSystem();
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [isDevicePickerOpen, setIsDevicePickerOpen] = useState(false);

    const isDragging = useRef(false);
    const dragStartValue = useRef(false);

    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

    const handleAddSchedule = () => {
        const newSchedule: Schedule = {
            id: crypto.randomUUID(),
            name: 'New Schedule',
            deviceIds: [],
            activeSlots: new Array(672).fill(false),
            enabled: true,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
        addSchedule(newSchedule);
        setSelectedScheduleId(newSchedule.id);
    };

    const handleDuplicateSchedule = (e: React.MouseEvent, schedule: Schedule) => {
        e.stopPropagation();
        const newSchedule: Schedule = {
            ...schedule,
            id: crypto.randomUUID(),
            name: `${schedule.name} (Copy)`,
        };
        addSchedule(newSchedule);
        setSelectedScheduleId(newSchedule.id);
    };

    const handleCopyDay = (sourceDayIndex: number, target: 'weekdays' | 'all' | number) => {
        if (!selectedSchedule) return;

        const newSlots = [...selectedSchedule.activeSlots];
        const sourceSlots = newSlots.slice(sourceDayIndex * 96, (sourceDayIndex + 1) * 96);

        const targetDays: number[] = [];
        if (target === 'all') {
            for (let d = 0; d < 7; d++) if (d !== sourceDayIndex) targetDays.push(d);
        } else if (target === 'weekdays') {
            for (let d = 0; d < 5; d++) if (d !== sourceDayIndex) targetDays.push(d);
        } else if (typeof target === 'number') {
            if (target !== sourceDayIndex) targetDays.push(target);
        }

        targetDays.forEach(d => {
            for (let i = 0; i < 96; i++) {
                newSlots[(d * 96) + i] = sourceSlots[i];
            }
        });

        updateSchedule({ ...selectedSchedule, activeSlots: newSlots });
    };

    const handleCopyFirstHourToDay = (dayIndex: number) => {
        if (!selectedSchedule) return;
        const newSlots = [...selectedSchedule.activeSlots];
        const firstHourSlots = newSlots.slice(dayIndex * 96, (dayIndex * 96) + 4);

        for (let h = 1; h < 24; h++) {
            for (let i = 0; i < 4; i++) {
                newSlots[(dayIndex * 96) + (h * 4) + i] = firstHourSlots[i];
            }
        }
        updateSchedule({ ...selectedSchedule, activeSlots: newSlots });
    };

    const toggleSlot = (dayIndex: number, hourIndex: number, quarterIndex: number, value?: boolean) => {
        if (!selectedSchedule) return;
        const slotIndex = (dayIndex * 96) + (hourIndex * 4) + quarterIndex;
        const newSlots = [...selectedSchedule.activeSlots];
        newSlots[slotIndex] = value !== undefined ? value : !newSlots[slotIndex];
        updateSchedule({ ...selectedSchedule, activeSlots: newSlots });
    };

    const handleMouseDown = (day: number, hour: number, quarter: number) => {
        if (!selectedSchedule) return;
        isDragging.current = true;
        const slotIndex = (day * 96) + (hour * 4) + quarter;
        dragStartValue.current = !selectedSchedule.activeSlots[slotIndex];
        toggleSlot(day, hour, quarter, dragStartValue.current);
    };

    const handleMouseEnter = (day: number, hour: number, quarter: number) => {
        if (isDragging.current && selectedSchedule) {
            toggleSlot(day, hour, quarter, dragStartValue.current);
        }
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const toggleDeviceInSchedule = (deviceId: string) => {
        if (!selectedSchedule) return;
        const newDeviceIds = selectedSchedule.deviceIds.includes(deviceId)
            ? selectedSchedule.deviceIds.filter(id => id !== deviceId)
            : [...selectedSchedule.deviceIds, deviceId];
        updateSchedule({ ...selectedSchedule, deviceIds: newDeviceIds });
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg flex flex-col md:flex-row gap-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Sidebar: Schedule List */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Calendar className="text-green-400" />
                        Schedules
                    </h2>
                    <button onClick={handleAddSchedule} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white" title="Add New Schedule">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {schedules.map(schedule => (
                        <div
                            key={schedule.id}
                            onClick={() => setSelectedScheduleId(schedule.id)}
                            className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedScheduleId === schedule.id
                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'bg-zinc-900 border-zinc-700/50 hover:border-zinc-500 hover:bg-zinc-800/50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 w-3/4">
                                    <input
                                        type="checkbox"
                                        checked={schedule.enabled}
                                        onChange={(e) => updateSchedule({ ...schedule, enabled: e.target.checked })}
                                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <input
                                        type="text"
                                        value={schedule.name}
                                        onChange={(e) => updateSchedule({ ...schedule, name: e.target.value })}
                                        className={`bg-transparent font-medium focus:outline-none w-full text-sm ${!schedule.enabled ? 'text-zinc-500 line-through' : 'text-white'}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => handleDuplicateSchedule(e, schedule)} className="text-zinc-600 hover:text-white"><Copy size={13} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); removeSchedule(schedule.id); }} className="text-zinc-600 hover:text-red-400"><Trash2 size={13} /></button>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                <span>{schedule.deviceIds.length} Devices</span>
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: schedule.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Schedule Grid & Device Assignment */}
            <div className="flex-1 min-w-0">
                {selectedSchedule ? (
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    Pattern for <span style={{ color: selectedSchedule.color }}>{selectedSchedule.name}</span>
                                </h3>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Assign appliances and define timing</p>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsDevicePickerOpen(!isDevicePickerOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-sm text-white transition-colors border border-zinc-600"
                                >
                                    <Settings2 size={14} />
                                    Manage Devices
                                    {selectedSchedule.deviceIds.length > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full ml-1">
                                            {selectedSchedule.deviceIds.length}
                                        </span>
                                    )}
                                </button>

                                {isDevicePickerOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-zinc-800">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assign Devices</span>
                                            <button onClick={() => setIsDevicePickerOpen(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                            {devices.map(device => {
                                                const isActive = selectedSchedule.deviceIds.includes(device.id);
                                                return (
                                                    <div
                                                        key={device.id}
                                                        onClick={() => toggleDeviceInSchedule(device.id)}
                                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${isActive ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
                                                    >
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Smartphone size={12} className={isActive ? 'text-blue-400' : 'text-zinc-600'} />
                                                            <span className="text-sm truncate">{device.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono">{device.powerWatts}W</span>
                                                            {isActive ? <Check size={14} /> : <div className="w-3.5" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {devices.length === 0 && (
                                                <div className="p-4 text-center text-xs text-zinc-500">First add devices in the Device Library.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <div className="col-start-2 grid grid-cols-24 gap-px text-xs text-zinc-500 text-center mb-1">
                                        {HOURS.map(h => <div key={h} className="col-span-1 border-l border-zinc-800/50">{h}</div>)}
                                    </div>
                                    {DAYS.map((dayName, dayIndex) => (
                                        <Fragment key={dayName}>
                                            <div className="flex items-center justify-between pr-2 py-1">
                                                <span className="text-sm font-medium text-zinc-500">{dayName}</span>
                                                <div className="relative group">
                                                    <button className="text-zinc-700 hover:text-zinc-400 py-1"><MoreHorizontal size={14} /></button>
                                                    <div className="absolute left-0 top-full pt-1 z-10 hidden group-hover:block w-48 animate-in fade-in slide-in-from-top-1">
                                                        <div className="bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1 overflow-hidden">
                                                            <button onClick={() => handleCopyFirstHourToDay(dayIndex)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-blue-400 hover:text-white transition-colors font-semibold">Copy First Hour to Day</button>
                                                            <div className="border-t border-zinc-700 my-1"></div>
                                                            <button onClick={() => handleCopyDay(dayIndex, 'weekdays')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors">Copy to Weekdays</button>
                                                            <button onClick={() => handleCopyDay(dayIndex, 'all')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors">Copy to All Days</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-24 border-zinc-800 bg-zinc-800 gap-px">
                                                {HOURS.map((hourIndex) => (
                                                    <div key={hourIndex} className="grid grid-cols-4 h-8 bg-zinc-900 shadow-inner">
                                                        {[0, 1, 2, 3].map((quarterIndex) => {
                                                            const slotIndex = (dayIndex * 96) + (hourIndex * 4) + quarterIndex;
                                                            const isActive = selectedSchedule.activeSlots[slotIndex];
                                                            return (
                                                                <div
                                                                    key={quarterIndex}
                                                                    onMouseDown={() => handleMouseDown(dayIndex, hourIndex, quarterIndex)}
                                                                    onMouseEnter={() => handleMouseEnter(dayIndex, hourIndex, quarterIndex)}
                                                                    className={`col-span-1 h-full cursor-crosshair transition-all duration-75 ${isActive ? 'scale-y-[0.8] rounded-[2px]' : 'hover:bg-zinc-800/50'}`}
                                                                    style={{ backgroundColor: isActive ? selectedSchedule.color : undefined }}
                                                                    title={`${dayName} ${hourIndex}:${quarterIndex * 15}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                        Select or create a schedule to define timings
                    </div>
                )}
            </div>
        </div>
    );
};
