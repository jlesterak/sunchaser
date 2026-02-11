import SunCalc from 'suncalc';
import { DateTime } from 'luxon';

// Types
export interface Location {
    latitude: number;
    longitude: number;
}

export interface SolarSystemSpecs {
    arraySizeKw: number; // Size of solar array in Kilowatts
    systemEfficiency: number; // e.g., 0.85 for 85%
    tiltAngle?: number; // Optional: Panel tilt in degrees (default to lat)
    azimuth?: number; // Optional: Panel azimuth in degrees (default 180 for south)
}

/**
 * Calculates the estimated solar power generation at a specific moment.
 * Uses a simplified model based on sun position and system size, optionally adjusted for cloud cover.
 * 
 * @param date Javascript Date object representing the moment
 * @param location location coordinates
 * @param specs Solar system specifications
 * @param cloudCover Optional: Cloud cover fraction (0.0 to 1.0). 0 = clear, 1 = overcast.
 * @returns Estimated power generation in kW
 */
export function calculateSolarPower(
    date: Date,
    location: Location,
    specs: SolarSystemSpecs,
    cloudCover: number = 0
): number {
    // Get sun position
    const sunPos = SunCalc.getPosition(date, location.latitude, location.longitude);
    const altitude = sunPos.altitude; // In radians. 0 is horizon, PI/2 is zenith.

    // If sun is below horizon, 0 power
    if (altitude <= 0) {
        return 0;
    }

    // Simplified Clear Sky Model
    const incidenceFactor = Math.sin(altitude);

    // System losses and efficiency
    // If the sun is very low (e.g. < 5 deg), generation is negligible/zero due to atmosphere and obstacles.
    if (altitude < (5 * Math.PI / 180)) return 0;

    let estimatedPower = specs.arraySizeKw * incidenceFactor * specs.systemEfficiency;

    // Apply Cloud Cover Adjustment if provided
    // Formula: Power = ClearSky * (1 - (0.75 * cloudCover))
    // This assumes even 100% clouds let ~25% diffuse light through.
    if (cloudCover > 0) {
        const cloudFactor = 1 - (0.75 * cloudCover);
        estimatedPower *= cloudFactor;
    }

    return Math.max(0, estimatedPower);
}

/**
 * Generates solar production data for a specified number of days.
 * 
 * @param weatherData Optional: Map of timestamp (ISO string usually or similar) to cloud cover (0-100) or direct influence
 */
export function simulateSolarGeneration(
    startDate: Date,
    durationDays: number,
    location: Location,
    specs: SolarSystemSpecs,
    weatherData?: { [timeKey: string]: number } // Map "YYYY-MM-DDTHH:00" -> cloudCover (0-100)
): { time: Date; powerKw: number; cloudCover?: number }[] {
    const result = [];
    // Ensure start is beginning of the local day to match chart expectations usually,
    // but here we just take the passed javascript date.
    // Ideally we should align with the weather data which is hourly.

    // We'll iterate by 15 mins. Weather data is hourly. We can interpolate or just step.

    // For simplicity, let's process weatherData into a lookup if needed.
    // Open-Meteo returns hourly strings like "2023-10-27T00:00".

    const startOfDay = DateTime.fromJSDate(startDate).startOf('day');
    const totalIntervals = 96 * durationDays;

    for (let i = 0; i < totalIntervals; i++) {
        const time = startOfDay.plus({ minutes: i * 15 }).toJSDate();

        // Find matching weather data
        // Weather data is usually hourly. match "YYYY-MM-DDTHH:00"
        let cloudCover = 0;
        if (weatherData) {
            // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
            // Open-Meteo uses local time usually? Or GMT? 
            // The API request didn't specify timezone, so it defaults to GMT (Z).
            // Actually Open-Meteo defaults to GMT if not specified.
            // Let's assume we match on the hour.
            // Let's assume we match on the hour.
            // If our simulation is local time based, we might have mismatch if API is GMT.
            // For MVP, we'll try to match exact string key if we parsed it that way.

            // Actually, let's make weatherData keyed by simple hour string?
            // "2023-10-27T08:00"
            const iso = time.toISOString();
            const hourKey = iso.slice(0, 13) + ":00"; // simplistic matching

            if (weatherData[hourKey] !== undefined) {
                cloudCover = weatherData[hourKey] / 100; // API usually 0-100
            }
        }

        const power = calculateSolarPower(time, location, specs, cloudCover);
        result.push({ time, powerKw: power, cloudCover });
    }

    return result;
}
