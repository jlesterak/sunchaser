import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { Save, Play, Trash2, ListChecks, X, Check } from 'lucide-react';

export const PresetManager: React.FC = () => {
    const { presets, savePreset, applyPreset, removePreset } = useSystem();
    const [isSaving, setIsSaving] = useState(false);
    const [presetName, setPresetName] = useState('');

    const handleSave = () => {
        if (!presetName.trim()) return;
        savePreset(presetName.trim());
        setPresetName('');
        setIsSaving(false);
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <ListChecks className="text-orange-400" />
                    System Presets
                </h2>
                <button
                    onClick={() => setIsSaving(true)}
                    className="p-1.5 bg-orange-600 hover:bg-orange-700 rounded text-white flex items-center gap-2 text-sm px-3 transition-colors"
                >
                    <Save size={16} />
                    Save Current
                </button>
            </div>

            {isSaving && (
                <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-orange-500/30 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Preset Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. Winter Mode, Heavy Load"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                            autoFocus
                        />
                        <button onClick={() => setIsSaving(false)} className="p-2 text-zinc-400 hover:text-white"><X size={20} /></button>
                        <button
                            onClick={handleSave}
                            disabled={!presetName.trim()}
                            className="p-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-white"
                        >
                            <Check size={20} />
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 italic">
                        This will save which schedules are currently enabled.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presets.map(preset => (
                    <div key={preset.id} className="group bg-zinc-900 border border-zinc-700/50 hover:border-orange-500/50 p-3 rounded-lg flex items-center justify-between transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-zinc-800 rounded text-orange-400">
                                <ListChecks size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-sm font-medium text-white truncate">{preset.name}</h3>
                                <p className="text-[10px] text-zinc-500">
                                    {preset.enabledScheduleIds.length} active schedules
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => applyPreset(preset.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-orange-600 text-zinc-300 hover:text-white rounded text-xs transition-colors"
                            >
                                <Play size={12} fill="currentColor" />
                                Apply
                            </button>
                            <button
                                onClick={() => removePreset(preset.id)}
                                className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {presets.length === 0 && !isSaving && (
                    <div className="sm:col-span-2 text-center py-6 border-2 border-dashed border-zinc-800 rounded-lg">
                        <p className="text-zinc-500 text-sm">No presets saved yet.</p>
                        <button onClick={() => setIsSaving(true)} className="text-orange-400 text-sm hover:underline mt-1">Save your first configuration</button>
                    </div>
                )}
            </div>
        </div>
    );
};
