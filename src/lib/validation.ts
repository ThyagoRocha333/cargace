import { z } from "zod";

const nonNegative = z.number().finite().min(0);
const positive = z.number().finite().gt(0);

export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Informe o fabricante.").max(80),
  model: z.string().trim().min(1, "Informe o modelo.").max(100),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  battery_capacity_kwh: positive.max(500),
  estimated_consumption_kwh_100km: positive.max(200).nullable().optional(),
  connector_type: z.string().trim().max(80).nullable().optional(),
});

export const chargeSchema = z.object({
  vehicle_id: z.string().uuid("Selecione um veículo."),
  charged_at: z.string().datetime({ offset: true }),
  charging_type: z.enum(["home", "public"]),
  location_name: z.string().trim().max(180).nullable().optional(),
  station_id: z.number().int().positive().nullable().optional(),
  energy_kwh: positive.max(1000),
  total_cost_brl: nonNegative.max(1_000_000),
  distance_km: nonNegative.max(1_000_000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const chargeFormSchema = chargeSchema.extend({
  charged_at: z.string().min(1, "Informe a data e hora."),
});

export const settingsSchema = z
  .object({
    home_tariff_brl_kwh: nonNegative.max(100),
    gasoline_price_brl_liter: nonNegative.max(100).nullable(),
    gasoline_efficiency_km_liter: positive.max(100).nullable(),
  })
  .refine(
    (settings) =>
      (settings.gasoline_price_brl_liter === null &&
        settings.gasoline_efficiency_km_liter === null) ||
      (settings.gasoline_price_brl_liter !== null &&
        settings.gasoline_efficiency_km_liter !== null),
    {
      message:
        "Informe preço e consumo de gasolina juntos, ou deixe os dois em branco.",
      path: ["gasoline_efficiency_km_liter"],
    },
  );

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type ChargeInput = z.infer<typeof chargeSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
