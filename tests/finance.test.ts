import { describe, expect, it } from "vitest";
import {
  averageCostPerKwh,
  costPerKm,
  fuelComparison,
  type ChargeForCalculation,
} from "../src/lib/finance";

const charges: ChargeForCalculation[] = [
  {
    energy_kwh: 10,
    total_cost_brl: 20,
    distance_km: 100,
    charged_at: "2026-01-03T10:00:00Z",
  },
  {
    energy_kwh: 5,
    total_cost_brl: 15,
    distance_km: null,
    charged_at: "2026-01-04T10:00:00Z",
  },
  {
    energy_kwh: 10,
    total_cost_brl: 10,
    distance_km: 50,
    charged_at: "2026-01-05T10:00:00Z",
  },
];

describe("cálculos financeiros auditáveis", () => {
  it("calcula o custo médio por kWh ponderado pela energia", () => {
    expect(averageCostPerKwh(charges)).toBe(45 / 25);
    expect(averageCostPerKwh([])).toBeNull();
  });

  it("usa somente recargas com distância maior que zero no custo por km", () => {
    expect(costPerKm(charges)).toBe(30 / 150);
    expect(costPerKm([{ ...charges[0], distance_km: null }])).toBeNull();
    expect(costPerKm([{ ...charges[0], distance_km: 0 }])).toBeNull();
  });

  it("estima gasolina e economia somente quando há premissas e distância", () => {
    expect(fuelComparison(charges, 7, 14)).toEqual({
      distanceKm: 150,
      electricCost: 30,
      gasolineCost: 75,
      savings: 45,
    });
    expect(fuelComparison(charges, 7, 0)).toBeNull();
    expect(
      fuelComparison([{ ...charges[1], distance_km: null }], 7, 14),
    ).toBeNull();
  });
});
