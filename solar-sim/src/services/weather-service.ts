
export interface HourlyWeatherData {
    time: string[];
    cloud_cover: number[];
}

export interface WeatherResponse {
    latitude: number;
    longitude: number;
    hourly: HourlyWeatherData;
}

/**
 * Fetches hourly weather forecast (specifically cloud cover) from Open-Meteo.
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param startDate The start date for the forecast
 * @param days Number of days to fetch
 * @returns Promise<HourlyWeatherData | null>
 */
export async function getHourlyCloudCover(
    lat: number,
    lon: number,
    startDate: Date,
    days: number
): Promise<HourlyWeatherData | null> {
    try {
        const startStr = startDate.toISOString().split('T')[0];
        // Open-Meteo uses YYYY-MM-DD format

        // Construct API URL
        // We use the 'forecast' endpoint. It usually provides 7 days.
        // For longer durations or past data, we might need 'archive' but let's stick to forecast for now as per requirements.
        // Open-Meteo allows specifying start_date and end_date.

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);
        const endStr = endDate.toISOString().split('T')[0];

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover&start_date=${startStr}&end_date=${endStr}&timezone=auto`;

        console.log(`Fetching weather data from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.statusText}`);
        }

        const data: WeatherResponse = await response.json();
        return data.hourly;
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
    }
}
