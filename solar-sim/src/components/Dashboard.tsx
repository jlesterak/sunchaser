import { useMemo, useState, useEffect } from 'react';
import { useSystem } from '../context/SystemContext';
import { simulateSolarGeneration } from '../utils/solar-sim';
import { simulateBatterySystem } from '../utils/battery-sim';
import { getHourlyCloudCover } from '../services/weather-service';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { DateTime } from 'luxon';
import { Activity, CloudRain } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const Dashboard: React.FC = () => {
    const { batterySpecs, solarSpecs, location, devices, schedules, simulationDate, simulationDays, setSimulationDays, useLiveWeather } = useSystem();
    const [weatherData, setWeatherData] = useState<{ [timeKey: string]: number } | undefined>(undefined);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Fetch Weather Data
    useEffect(() => {
        if (!useLiveWeather) {
            setWeatherData(undefined);
            return;
        }

        const fetchWeather = async () => {
            setIsLoadingWeather(true);
            // Ensure we pass the start of the day in local terms to the weather service
            const localStart = DateTime.fromJSDate(simulationDate).startOf('day').toJSDate();
            const data = await getHourlyCloudCover(location.latitude, location.longitude, localStart, simulationDays);
            if (data) {
                // Transform to Map
                const map: { [key: string]: number } = {};
                data.time.forEach((t, i) => {
                    // Open-Meteo format: "2023-10-27T00:00"
                    // solar-sim.ts uses: timeDt.toFormat("yyyy-MM-dd'T'HH:00")
                    // Which results in the same format.
                    map[t] = data.cloud_cover[i];
                });
                setWeatherData(map);
            }
            setIsLoadingWeather(false);
        };

        fetchWeather();
    }, [useLiveWeather, location, simulationDate, simulationDays]);

    // Run Simulation
    const simulationResults = useMemo(() => {
        // 1. Generate Solar Data
        const solarData = simulateSolarGeneration(simulationDate, simulationDays, location, solarSpecs, weatherData);

        // 2. Generate Load Data (Aggregated from all enabled schedules)
        const loadData = solarData.map((step) => {
            const stepDateTime = DateTime.fromJSDate(step.time);
            // Convert to 0=Mon, 6=Sun
            const dayOfWeek = (stepDateTime.weekday - 1);
            const slotInDay = Math.floor((stepDateTime.hour * 60 + stepDateTime.minute) / 15);
            const slotIndex = (dayOfWeek * 96) + slotInDay;

            let activeDeviceIds = new Set<string>();
            schedules.filter(s => s.enabled && s.activeSlots[slotIndex]).forEach(schedule => {
                schedule.deviceIds.forEach(id => activeDeviceIds.add(id));
            });

            // Filter by dependencies
            let changed = true;
            while (changed) {
                changed = false;
                const nextActiveIds = new Set<string>();
                activeDeviceIds.forEach(id => {
                    const device = devices.find(d => d.id === id);
                    if (device && (!device.requiresDeviceId || activeDeviceIds.has(device.requiresDeviceId))) {
                        nextActiveIds.add(id);
                    } else {
                        changed = true;
                    }
                });
                if (nextActiveIds.size !== activeDeviceIds.size) {
                    activeDeviceIds = nextActiveIds;
                    changed = true;
                } else {
                    changed = false;
                }
            }

            let totalPowerWatts = 0;
            activeDeviceIds.forEach(id => {
                const device = devices.find(d => d.id === id);
                if (device) totalPowerWatts += device.powerWatts;
            });

            return { time: step.time, powerKw: totalPowerWatts / 1000 };
        });

        // 3. Simulate Battery
        const steps = simulateBatterySystem(solarData, loadData, batterySpecs);

        // 4. Aggregate Daily Stats (if needed)
        const dailyStats = [];
        if (simulationDays > 1) {
            for (let d = 0; d < simulationDays; d++) {
                const dayStart = DateTime.fromJSDate(simulationDate).plus({ days: d }).startOf('day');
                const dayEnd = dayStart.endOf('day');

                const daySteps = steps.filter(s => {
                    const t = DateTime.fromJSDate(s.time);
                    return t >= dayStart && t <= dayEnd;
                });

                if (daySteps.length > 0) {
                    const solar = daySteps.reduce((acc, s) => acc + s.usefulSolarKw * 0.25, 0);
                    const load = daySteps.reduce((acc, s) => acc + s.loadConsumptionKw * 0.25, 0);
                    const minSoC = Math.min(...daySteps.map(s => s.batterySoC));
                    const maxSoC = Math.max(...daySteps.map(s => s.batterySoC));
                    const avgCloud = daySteps.reduce((acc, s) => acc + (s.cloudCover || 0), 0) / daySteps.length;

                    dailyStats.push({ date: dayStart, solar, load, minSoC, maxSoC, avgCloud });
                }
            }
        }

        return { steps, dailyStats };
    }, [batterySpecs, solarSpecs, location, devices, schedules, simulationDate, simulationDays, weatherData]);

    // Chart Data Logic
    let ChartComponent = Line;
    let chartData: any = {};
    let chartOptions: any = {};


    if (simulationDays === 1) {
        // DETAILED VIEW (Line Chart)
        chartData = {
            labels: simulationResults.steps.map(s => DateTime.fromJSDate(s.time).toFormat('HH:mm')),
            datasets: [
                {
                    label: 'Solar Gen (kW)',
                    data: simulationResults.steps.map(s => s.solarGenerationKw),
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.5)',
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Load (kW)',
                    data: simulationResults.steps.map(s => s.loadConsumptionKw),
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Battery SoC (%)',
                    data: simulationResults.steps.map(s => s.batterySoC * 100),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y1',
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: 'Cloud Cover (%)',
                    data: simulationResults.steps.map(s => (s.cloudCover || 0) * 100),
                    borderColor: 'rgba(156, 163, 175, 0.8)',
                    backgroundColor: 'rgba(156, 163, 175, 0.2)',
                    yAxisID: 'y1',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: true,
                },
            ],
        };

        chartOptions = {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            stacked: false,
            plugins: {
                legend: { labels: { color: '#e5e7eb' } }
            },
            scales: {
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: 'Power (kW)', color: '#9ca3af' },
                    ticks: { color: '#9ca3af' }, grid: { color: '#374151' }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: 'Battery %', color: '#9ca3af' },
                    min: 0, max: 100, ticks: { color: '#9ca3af' }, grid: { drawOnChartArea: false }
                },
                x: { ticks: { color: '#9ca3af', maxTicksLimit: 12 }, grid: { color: '#374151' } }
            },
        };

    } else {
        // SUMMARY VIEW (Bar/Line Combo)
        // Actually, let's use a Bar chart for Energy and a Line for SoC Range?
        // Or just a Bar chart with grouped bars for Solar/Load and a line for Min SoC?
        ChartComponent = Bar as any; // Cast to avoid TS issues switching components

        chartData = {
            labels: simulationResults.dailyStats.map(s => s.date.toFormat('MMM dd')),
            datasets: [
                {
                    type: 'bar',
                    label: 'Used Solar (kWh)',
                    data: simulationResults.dailyStats.map(s => s.solar),
                    backgroundColor: 'rgba(255, 205, 86, 0.7)',
                    yAxisID: 'y',
                },
                {
                    type: 'bar',
                    label: 'Load (kWh)',
                    data: simulationResults.dailyStats.map(s => s.load),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    yAxisID: 'y',
                },
                {
                    type: 'line',
                    label: 'Min SoC (%)',
                    data: simulationResults.dailyStats.map(s => s.minSoC * 100),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgb(239, 68, 68)',
                    yAxisID: 'y1',
                },
                {
                    type: 'line',
                    label: 'Max SoC (%)',
                    data: simulationResults.dailyStats.map(s => s.maxSoC * 100),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgb(34, 197, 94)',
                    yAxisID: 'y1',
                },
                {
                    type: 'line',
                    label: 'Avg Cloud (%)',
                    data: simulationResults.dailyStats.map(s => (s.avgCloud || 0) * 100),
                    borderColor: 'rgba(156, 163, 175, 0.8)',
                    backgroundColor: 'rgba(156, 163, 175, 0.8)',
                    yAxisID: 'y1',
                    borderDash: [5, 5],
                }
            ]
        };

        chartOptions = {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e5e7eb' } }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Energy (kWh)', color: '#9ca3af' },
                    ticks: { color: '#9ca3af' }, grid: { color: '#374151' }
                },
                y1: {
                    position: 'right',
                    title: { display: true, text: 'Min/Max SoC %', color: '#9ca3af' },
                    min: 0, max: 100, ticks: { color: '#9ca3af' }, grid: { drawOnChartArea: false }
                },
                x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }
            },
        };
    }

    // Calculate Grand Totals
    const totalSolarKwh = simulationResults.steps.reduce((acc, s) => acc + s.usefulSolarKw * 0.25, 0);
    const totalLoadKwh = simulationResults.steps.reduce((acc, s) => acc + s.loadConsumptionKw * 0.25, 0);
    const totalGridImport = simulationResults.steps.reduce((acc, s) => acc + s.gridImportKw * 0.25, 0);
    const minSoC = Math.min(...simulationResults.steps.map(s => s.batterySoC)) * 100;

    return (
        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="text-purple-500" />
                    Performance Dashboard
                    {useLiveWeather && (
                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${isLoadingWeather ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
                            <CloudRain size={12} />
                            {isLoadingWeather ? 'Fetching Weather...' : 'Live Weather Active'}
                        </span>
                    )}
                </h2>

                <div className="flex bg-zinc-900 rounded p-1">
                    {[1, 7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setSimulationDays(d)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${simulationDays === d
                                ? 'bg-zinc-700 text-white font-medium shadow'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {d === 1 ? '24 Hours' : `${d} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-900 p-4 rounded text-center">
                    <div className="text-zinc-400 text-sm">Used Solar Gen</div>
                    <div className="text-2xl font-bold text-yellow-400">{totalSolarKwh.toFixed(1)} <span className="text-sm">kWh</span></div>
                </div>
                <div className="bg-zinc-900 p-4 rounded text-center">
                    <div className="text-zinc-400 text-sm">Total Load</div>
                    <div className="text-2xl font-bold text-blue-400">{totalLoadKwh.toFixed(1)} <span className="text-sm">kWh</span></div>
                </div>
                <div className="bg-zinc-900 p-4 rounded text-center">
                    <div className="text-zinc-400 text-sm">Grid Import / Deficit</div>
                    <div className={`text-2xl font-bold ${totalGridImport > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {totalGridImport.toFixed(1)} <span className="text-sm">kWh</span>
                    </div>
                </div>
                <div className="bg-zinc-900 p-4 rounded text-center">
                    <div className="text-zinc-400 text-sm">Lowest Battery %</div>
                    <div className={`text-2xl font-bold ${minSoC < 20 ? 'text-red-500' : 'text-green-500'}`}>
                        {minSoC.toFixed(0)}%
                    </div>
                </div>
            </div>

            <div className="h-[400px]">
                {/* @ts-ignore */}
                <ChartComponent options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};
