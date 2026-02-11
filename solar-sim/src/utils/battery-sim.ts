

export interface BatterySpecs {
    capacityKwh: number; // Total capacity in kWh
    voltage: number; // System voltage (e.g., 12, 24, 48)
    ampHours: number; // Capacity in Ah
    efficiency: number; // Round-trip efficiency (e.g., 0.95)
    maxChargeRateKw: number; // Max charge power in kW
    maxDischargeRateKw: number; // Max discharge power in kW
    initialSoC: number; // Initial State of Charge (0-1)
}

export interface SimulationStep {
    time: Date;
    solarGenerationKw: number;
    loadConsumptionKw: number;
    batterySoC: number; // 0-1
    gridImportKw: number; // If system is grid-tied or backup generator used (optional)
    batteryFlowKw: number; // Positive = Charging, Negative = Discharging
    usefulSolarKw: number; // Solar energy actually used (Load + Battery Charge)
}

/**
 * Simulates battery behavior over time.
 * 
 * @param solarData Array of solar generation data (time, kw)
 * @param loadData Array of load consumption data (time, kw) - must align with solarData
 * @param specs Battery specifications
 * @returns Array of SimulationStep results
 */
export function simulateBatterySystem(
    solarData: { time: Date; powerKw: number }[],
    loadData: { time: Date; powerKw: number }[],
    specs: BatterySpecs
): SimulationStep[] {
    const steps: SimulationStep[] = [];

    let currentEnergyKwh = specs.capacityKwh * specs.initialSoC;

    // Ensure we have aligned data
    const length = Math.min(solarData.length, loadData.length);

    for (let i = 0; i < length; i++) {
        const solar = solarData[i].powerKw;
        const load = loadData[i].powerKw;
        const time = solarData[i].time;

        // Net power available (Solar - Load)
        const netPowerKw = solar - load;

        // Duration of step in hours (assuming 15 min intervals usually, but calculating delta)
        let hours = 0.25; // Default 15 mins
        if (i > 0) {
            const diffMs = time.getTime() - solarData[i - 1].time.getTime();
            hours = diffMs / (1000 * 60 * 60);
        }

        let batteryFlowKw = 0;
        let gridImportKw = 0; // Or lost load

        if (netPowerKw > 0) {
            // Surplus energy -> Charge battery
            // Limit by max charge rate
            const chargePowerKw = Math.min(netPowerKw, specs.maxChargeRateKw);

            // Calculate energy to add (considering efficiency)
            // Usually efficiency is applied on charge (or roundtrip split).
            // Let's apply sqrt(efficiency) on charge and discharge for simplicity, or just on charge.
            // Standard: EnergyIn * Efficiency = EnergyStored.
            // usually energyAdded = chargePower * hours * efficiency
            const energyToStore = chargePowerKw * hours * specs.efficiency; // conservative

            // Check capacity limit
            const maxStorage = specs.capacityKwh;
            const spaceAvailable = maxStorage - currentEnergyKwh;

            const energyAdded = Math.min(energyToStore, spaceAvailable);

            // Update actual flow (back-calculate from energy added)
            // This is tricky if we hit capacity limit.
            // logic: batteryFlowKw = energyAdded / (hours * efficiency)
            if (energyAdded > 0) {
                batteryFlowKw = energyAdded / (hours * specs.efficiency);
            } else {
                batteryFlowKw = 0;
            }

            currentEnergyKwh += energyAdded;

        } else {
            // Deficit -> Discharge battery
            const deficitKw = -netPowerKw;

            // Limit by max discharge rate
            const dischargePowerKw = Math.min(deficitKw, specs.maxDischargeRateKw);

            // Energy needed from battery
            const energyNeeded = dischargePowerKw * hours;

            // Check available energy
            const energyAvailable = currentEnergyKwh;

            const energyRemoved = Math.min(energyNeeded, energyAvailable);

            // Update battery state
            currentEnergyKwh -= energyRemoved;

            // Flow is negative for discharge
            // logic: batteryFlowKw = - (energyRemoved / hours)
            // Note: we don't apply efficiency on discharge if we applied it on charge?
            // Or we assume stored energy is "real" and losses happen on conversion.
            // Let's assume efficiency is Round Trip. So we lose on both ends or just one.
            // If we used `energyToStore = Power * efficiency`, then stored energy is "chemical potential".
            // Retrieving it might also have losses.
            // Simple model: Apply efficiency on Charge only (AC coupled equivalent).
            // So Discharge is 1:1 from stored capacity?
            // Let's stick to: Efficiency is usually specified as Round Trip.
            // So sqrt(eff) on charge, sqrt(eff) on discharge.
            // But let's keep it simple: Charge Efficiency = specs.efficiency. Discharge = 1.0 (lossless from stored).

            batteryFlowKw = -(energyRemoved / hours);

            // If we couldn't meet demand
            if (energyRemoved < energyNeeded) {
                // Remaining deficit is grid import or blackout
                const unmetEnergy = energyNeeded - energyRemoved;
                gridImportKw = unmetEnergy / hours;
            }

            // Check if we still have deficit due to power limit
            if (deficitKw > specs.maxDischargeRateKw) {
                gridImportKw += (deficitKw - specs.maxDischargeRateKw);
            }
        }

        let usefulSolarKw = solar;
        if (netPowerKw > 0) {
            // If we have surplus, useful solar is Load + What we put into battery
            usefulSolarKw = load + batteryFlowKw;
        }

        steps.push({
            time,
            solarGenerationKw: solar,
            loadConsumptionKw: load,
            batterySoC: currentEnergyKwh / specs.capacityKwh,
            gridImportKw,
            batteryFlowKw,
            usefulSolarKw
        });
    }

    return steps;
}
