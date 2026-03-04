
import { MapPin, Calendar, Crosshair, Map as MapIcon } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationPickerEvents({ setLocation }: { setLocation: (loc: any) => void }) {
    useMapEvents({
        click(e) {
            setLocation({
                latitude: parseFloat(e.latlng.lat.toFixed(4)),
                longitude: parseFloat(e.latlng.lng.toFixed(4))
            });
        },
    });
    return null;
}

export const LocationDatePanel: React.FC = () => {
    const { location, setLocation, simulationDate, setSimulationDate } = useSystem();
    const [showMap, setShowMap] = useState(false);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: parseFloat(position.coords.latitude.toFixed(4)),
                        longitude: parseFloat(position.coords.longitude.toFixed(4))
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
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg relative z-0">
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
                                // Parse as local date to avoid UTC shift
                                const dt = DateTime.fromISO(e.target.value);
                                setSimulationDate(dt.toJSDate());
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

                <div className="flex gap-2">
                    <button
                        onClick={handleGetCurrentLocation}
                        className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <Crosshair size={16} />
                        Current Location
                    </button>
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm ${showMap ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}
                    >
                        <MapIcon size={16} />
                        {showMap ? 'Hide Map' : 'Select on Map'}
                    </button>
                </div>

                {showMap && (
                    <div className="h-64 w-full rounded border border-zinc-700 overflow-hidden relative" style={{ zIndex: 1 }}>
                        <MapContainer
                            center={[location.latitude, location.longitude]}
                            zoom={4}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <LocationPickerEvents setLocation={setLocation} />
                            <Marker position={[location.latitude, location.longitude]} />
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
