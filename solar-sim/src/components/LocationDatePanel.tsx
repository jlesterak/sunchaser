
import { MapPin, Calendar, Crosshair } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { DateTime } from 'luxon';

export const LocationDatePanel: React.FC = () => {
    const { location, setLocation, simulationDate, setSimulationDate } = useSystem();

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    alert("Could not get your location. Please check browser permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="text-red-500" />
                Location & Date
            </h2>

            <div className="space-y-4">
                {/* Date Selection */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
                        <Calendar size={16} />
                        Simulation Date
                    </label>
                    <input
                        type="date"
                        value={DateTime.fromJSDate(simulationDate).toISODate() || ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                setSimulationDate(new Date(e.target.value));
                            }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Location Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Latitude</label>
                        <input
                            type="number"
                            value={location.latitude}
                            onChange={(e) => setLocation({ ...location, latitude: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Longitude</label>
                        <input
                            type="number"
                            value={location.longitude}
                            onChange={(e) => setLocation({ ...location, longitude: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <button
                    onClick={handleGetCurrentLocation}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <Crosshair size={18} />
                    Use My Current Location
                </button>
            </div>
        </div>
    );
};
