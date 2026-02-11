import { useState, useRef, Fragment } from 'react';
import { useSystem, type Load } from '../context/SystemContext';
import { Plus, Trash2, Zap, Copy, MoreHorizontal } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const LoadScheduler: React.FC = () => {
    const { loads, addLoad, updateLoad, removeLoad } = useSystem();
    const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
    const isDragging = useRef(false);
    const dragStartValue = useRef(false);

    const selectedLoad = loads.find(l => l.id === selectedLoadId);

    const handleAddLoad = () => {
        const newLoad: Load = {
            id: crypto.randomUUID(),
            name: 'New Load',
            powerWatts: 100,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            schedule: { activeSlots: new Array(672).fill(false) } // 7 * 96
        };
        addLoad(newLoad);
        setSelectedLoadId(newLoad.id);
    };

    const handleDuplicateLoad = (e: React.MouseEvent, load: Load) => {
        e.stopPropagation();
        const newLoad: Load = {
            ...load,
            id: crypto.randomUUID(),
            name: `${load.name} (Copy)`,
        };
        addLoad(newLoad);
        setSelectedLoadId(newLoad.id);
    };

    const handleCopyDay = (sourceDayIndex: number, target: 'weekdays' | 'all' | number) => {
        if (!selectedLoad) return;

        const newSlots = [...selectedLoad.schedule.activeSlots];
        const sourceSlots = newSlots.slice(sourceDayIndex * 96, (sourceDayIndex + 1) * 96);

        const targetDays: number[] = [];

        if (target === 'all') {
            for (let d = 0; d < 7; d++) {
                if (d !== sourceDayIndex) targetDays.push(d);
            }
        } else if (target === 'weekdays') {
            for (let d = 0; d < 5; d++) {
                if (d !== sourceDayIndex) targetDays.push(d);
            }
        } else if (typeof target === 'number') {
            if (target !== sourceDayIndex) targetDays.push(target);
        }

        // Apply copy
        targetDays.forEach(d => {
            for (let i = 0; i < 96; i++) {
                newSlots[(d * 96) + i] = sourceSlots[i];
            }
        });

        updateLoad({
            ...selectedLoad,
            schedule: { activeSlots: newSlots }
        });
    };

    const toggleSlot = (dayIndex: number, hourIndex: number, quarterIndex: number, value?: boolean) => {
        if (!selectedLoad) return;
        const slotIndex = (dayIndex * 96) + (hourIndex * 4) + quarterIndex;
        const newSlots = [...selectedLoad.schedule.activeSlots];
        newSlots[slotIndex] = value !== undefined ? value : !newSlots[slotIndex];
        updateLoad({ ...selectedLoad, schedule: { activeSlots: newSlots } });
    };

    const handleMouseDown = (day: number, hour: number, quarter: number) => {
        if (!selectedLoad) return;
        isDragging.current = true;
        const slotIndex = (day * 96) + (hour * 4) + quarter;
        dragStartValue.current = !selectedLoad.schedule.activeSlots[slotIndex];
        toggleSlot(day, hour, quarter, dragStartValue.current);
    };

    const handleMouseEnter = (day: number, hour: number, quarter: number) => {
        if (isDragging.current && selectedLoad) {
            toggleSlot(day, hour, quarter, dragStartValue.current);
        }
    };

    const handleMouseUp = () => { isDragging.current = false; };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg flex flex-col md:flex-row gap-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Sidebar: Load List */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="text-yellow-400" />
                        Loads
                    </h2>
                    <button onClick={handleAddLoad} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white" title="Add New Load">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {loads.map(load => (
                        <div
                            key={load.id}
                            onClick={() => setSelectedLoadId(load.id)}
                            className={`p-3 rounded cursor-pointer border transition-colors ${selectedLoadId === load.id
                                ? 'bg-blue-600/30 border-blue-500'
                                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <input
                                    type="text"
                                    value={load.name}
                                    onChange={(e) => updateLoad({ ...load, name: e.target.value })}
                                    className="bg-transparent font-medium focus:outline-none w-3/4"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => handleDuplicateLoad(e, load)}
                                        className="text-zinc-500 hover:text-white"
                                        title="Duplicate Load"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeLoad(load.id); }}
                                        className="text-zinc-500 hover:text-red-400"
                                        title="Delete Load"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="number"
                                    value={load.powerWatts}
                                    onChange={(e) => updateLoad({ ...load, powerWatts: parseInt(e.target.value) || 0 })}
                                    className="bg-zinc-950 w-20 px-2 py-1 text-sm rounded border border-zinc-700"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs text-zinc-400">Watts</span>
                            </div>
                        </div>
                    ))}
                    {loads.length === 0 && (
                        <div className="text-zinc-500 text-sm text-center py-4">No loads added. Click + to add devices.</div>
                    )}
                </div>
            </div>

            {/* Main Area: Schedule Grid */}
            <div className="flex-1 overflow-x-auto">
                {selectedLoad ? (
                    <div className="min-w-[800px]">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-300">
                            Schedule for <span className="text-white">{selectedLoad.name}</span>
                            <span className="text-sm font-normal text-zinc-500 ml-2">(Click & Drag to set active times)</span>
                        </h3>

                        {/* Use CSS Grid for the timeline */}
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                            {/* Header Row */}
                            <div className="col-start-2 grid grid-cols-24 gap-px text-xs text-zinc-500 text-center mb-1">
                                {HOURS.map(h => <div key={h} className="col-span-1 border-l border-zinc-700">{h}</div>)}
                            </div>

                            {/* Days Rows */}
                            {DAYS.map((dayName, dayIndex) => (
                                <Fragment key={dayName}>
                                    <div className="flex items-center justify-between pr-2 py-1">
                                        <span className="text-sm font-medium text-zinc-400">{dayName}</span>
                                        <div className="relative group">
                                            <button className="text-zinc-600 hover:text-zinc-300 py-1"><MoreHorizontal size={14} /></button>
                                            {/* Dropdown menu */}
                                            <div className="absolute left-0 top-full pt-1 z-10 hidden group-hover:block w-48">
                                                <div className="bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1">
                                                    <button onClick={() => handleCopyDay(dayIndex, 'weekdays')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors">Copy to Weekdays</button>
                                                    <button onClick={() => handleCopyDay(dayIndex, 'all')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors">Copy to All Days</button>
                                                    <div className="border-t border-zinc-700 my-1"></div>
                                                    {DAYS.map((dName, dIdx) => {
                                                        if (dIdx === dayIndex) return null;
                                                        return (
                                                            <button
                                                                key={dName}
                                                                onClick={() => handleCopyDay(dayIndex, dIdx)}
                                                                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                                            >
                                                                Copy to {dName}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-24 border-zinc-700 bg-zinc-700 gap-px">
                                        {HOURS.map((hourIndex) => (
                                            <div key={hourIndex} className="grid grid-cols-4 h-8 bg-zinc-900">
                                                {[0, 1, 2, 3].map((quarterIndex) => {
                                                    const slotIndex = (dayIndex * 96) + (hourIndex * 4) + quarterIndex;
                                                    const isActive = selectedLoad.schedule.activeSlots[slotIndex];
                                                    return (
                                                        <div
                                                            key={quarterIndex}
                                                            onMouseDown={() => handleMouseDown(dayIndex, hourIndex, quarterIndex)}
                                                            onMouseEnter={() => handleMouseEnter(dayIndex, hourIndex, quarterIndex)}
                                                            className={`
                                  col-span-1 h-full cursor-crosshair transition-colors
                                  ${isActive ? 'bg-green-500' : 'hover:bg-zinc-800'}
                                  ${quarterIndex === 3 ? 'border-r border-zinc-800/50' : ''}
                                `}
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
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-500">
                        Select a load to edit its schedule
                    </div>
                )}
            </div>
        </div>
    );
};
