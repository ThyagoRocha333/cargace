import { describe, expect, it } from "vitest";
import {
  averageCostPerKwh,
  chargesForPeriod,
  costPerKm,
  fuelComparison,
  fortalezaMonthKey,
  monthlyTotals,
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

  it("agrupa recargas usando o mês de Fortaleza, inclusive na virada UTC", () => {
    expect(fortalezaMonthKey("2026-03-01T02:59:59Z")).toBe("2026-02");
    expect(fortalezaMonthKey("2026-03-01T03:00:00Z")).toBe("2026-03");
    expect(fortalezaMonthKey("data inválida")).toBeNull();

    const grouped = monthlyTotals(
      [
        { ...charges[0], charged_at: "2026-03-01T02:59:59Z" },
        { ...charges[1], charged_at: "2026-03-01T03:00:00Z" },
      ],
      "all",
      new Date("2026-03-01T03:00:01Z"),
    );
    expect(grouped.find(({ key }) => key === "2026-02")?.cost).toBe(20);
    expect(grouped.find(({ key }) => key === "2026-03")?.cost).toBe(15);
  });

  it("aplica o período selecionado aos gráficos e inclui todo o histórico", () => {
    const history: ChargeForCalculation[] = [
      { ...charges[0], charged_at: "2024-12-15T12:00:00Z" },
      { ...charges[1], charged_at: "2025-04-15T12:00:00Z" },
      { ...charges[2], charged_at: "2026-03-01T03:00:00Z" },
    ];
    const now = new Date("2026-03-15T12:00:00Z");

    expect(monthlyTotals(history, "month", now).map(({ key }) => key)).toEqual([
      "2026-03",
    ]);
    const year = monthlyTotals(history, "year", now);
    expect(year).toHaveLength(12);
    expect(year[0].key).toBe("2025-04");
    expect(year.at(-1)?.key).toBe("2026-03");
    expect(year.at(-1)).toMatchObject({ cost: 10, energy: 10 });

    const all = monthlyTotals(history, "all", now);
    expect(all[0].key).toBe("2024-12");
    expect(all.at(-1)?.key).toBe("2026-03");
    expect(chargesForPeriod(history, "month", now)).toHaveLength(1);
    expect(chargesForPeriod(history, "year", now)).toHaveLength(2);
    expect(chargesForPeriod(history, "all", now)).toHaveLength(3);
  });

  it("ignora valores ausentes ou não finitos nos cálculos", () => {
    const invalid = [
      {
        ...charges[0],
        energy_kwh: Number.NaN,
        distance_km: Number.NaN,
      },
      { ...charges[1], total_cost_brl: Number.POSITIVE_INFINITY },
      {
        ...charges[2],
        energy_kwh: Number.NaN,
        distance_km: Number.NaN,
      },
    ];
    expect(averageCostPerKwh(invalid)).toBeNull();
    expect(costPerKm(invalid)).toBeNull();
    expect(fuelComparison(charges, Number.NaN, 14)).toBeNull();
  });
});
