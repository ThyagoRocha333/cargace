import { describe, expect, it } from "vitest";
import {
  chargeSchema,
  settingsSchema,
  vehicleSchema,
} from "../src/lib/validation";

describe("validação de entradas", () => {
  it("rejeita energia zero e custos negativos", () => {
    const result = chargeSchema.safeParse({
      vehicle_id: "c04d0b93-d397-4e8d-a5af-161ee68355d8",
      charged_at: "2026-01-02T10:00:00Z",
      charging_type: "home",
      energy_kwh: 0,
      total_cost_brl: -1,
      distance_km: null,
    });
    expect(result.success).toBe(false);
    expect(
      chargeSchema.safeParse({
        vehicle_id: "c04d0b93-d397-4e8d-a5af-161ee68355d8",
        charged_at: "2026-01-02T10:00:00Z",
        charging_type: "home",
        energy_kwh: 1,
        total_cost_brl: 0,
        distance_km: -1,
      }).success,
    ).toBe(false);
  });

  it("aceita veículo válido e rejeita capacidade não positiva", () => {
    const vehicle = {
      make: "BYD",
      model: "Dolphin",
      year: 2025,
      battery_capacity_kwh: 44.9,
      estimated_consumption_kwh_100km: null,
      connector_type: "Type 2",
    };
    expect(vehicleSchema.safeParse(vehicle).success).toBe(true);
    expect(
      vehicleSchema.safeParse({ ...vehicle, battery_capacity_kwh: 0 }).success,
    ).toBe(false);
  });

  it("não aceita comparação que divida por consumo zero", () => {
    expect(
      settingsSchema.safeParse({
        home_tariff_brl_kwh: 0.9,
        gasoline_price_brl_liter: 6.5,
        gasoline_efficiency_km_liter: 0,
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        home_tariff_brl_kwh: 0.9,
        gasoline_price_brl_liter: null,
        gasoline_efficiency_km_liter: null,
      }).success,
    ).toBe(true);
    expect(
      settingsSchema.safeParse({
        home_tariff_brl_kwh: 0.9,
        gasoline_price_brl_liter: 6.5,
        gasoline_efficiency_km_liter: null,
      }).success,
    ).toBe(false);
  });
});
