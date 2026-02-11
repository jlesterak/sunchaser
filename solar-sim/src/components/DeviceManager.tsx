import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { Plus, Trash2, Smartphone, PenLine } from 'lucide-react';

export const DeviceManager: React.FC = () => {
    const { devices, addDevice, updateDevice, removeDevice } = useSystem();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPower, setNewPower] = useState(100);
    const [newRequirement, setNewRequirement] = useState<string>('');

    const handleAdd = () => {
        if (!newName) return;
        addDevice({
            id: crypto.randomUUID(),
            name: newName,
            powerWatts: newPower,
            requiresDeviceId: newRequirement || undefined
        });
        setNewName('');
        setNewPower(100);
        setNewRequirement('');
        setIsAdding(false);
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Smartphone className="text-blue-400" />
                    Device Library
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2 text-sm px-3"
                >
                    <Plus size={16} />
                    Add Device
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-blue-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Device Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Fridge, Laptop"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Power (Watts)</label>
                            <input
                                type="number"
                                value={newPower}
                                onChange={(e) => setNewPower(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Requires (Optional)</label>
                            <select
                                value={newRequirement}
                                onChange={(e) => setNewRequirement(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">No Requirement</option>
                                {devices.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
                        <button onClick={handleAdd} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium">Create Device</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {devices.map(device => (
                    <div key={device.id} className="group bg-zinc-900/50 border border-zinc-700/50 hover:border-zinc-500 p-3 rounded-lg flex items-center justify-between transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-zinc-800 rounded text-zinc-400 group-hover:text-blue-400 transition-colors">
                                <Smartphone size={18} />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={device.name}
                                    onChange={(e) => updateDevice({ ...device, name: e.target.value })}
                                    className="bg-transparent font-medium text-white focus:outline-none focus:border-b border-blue-500 w-full"
                                />
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-500">
                                    <PenLine size={10} />
                                    <span>Rename</span>
                                </div>
                                <div className="mt-2">
                                    <select
                                        value={device.requiresDeviceId || ''}
                                        onChange={(e) => updateDevice({ ...device, requiresDeviceId: e.target.value || undefined })}
                                        className="bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">No Req.</option>
                                        {devices.filter(d => d.id !== device.id).map(d => (
                                            <option key={d.id} value={d.id}>Requires {d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="flex items-center gap-1 border-b border-zinc-800 focus-within:border-blue-500">
                                    <input
                                        type="number"
                                        value={device.powerWatts}
                                        onChange={(e) => updateDevice({ ...device, powerWatts: parseInt(e.target.value) || 0 })}
                                        className="bg-transparent text-sm text-white font-mono w-16 text-right focus:outline-none"
                                    />
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">W</span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeDevice(device.id)}
                                className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Device"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {devices.length === 0 && !isAdding && (
                    <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-lg">
                        <p className="text-zinc-500 text-sm">Your device library is empty.</p>
                        <button onClick={() => setIsAdding(true)} className="text-blue-400 text-sm hover:underline mt-2">Add your first appliance</button>
                    </div>
                )}
            </div>
        </div>
    );
};
