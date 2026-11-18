"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { chargeFormSchema, type ChargeInput } from "@/lib/validation";

type VehicleOption = { id: string; make: string; model: string };
type ChargeRecord = ChargeInput & { id: string; charged_at: string };
type SettingsRecord = { home_tariff_brl_kwh: number | null };
type FormValues = Omit<ChargeInput, "charged_at"> & { charged_at: string };

function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

async function errorMessage(response: Response) {
  const body: { error?: string } = await response.json();
  return body.error ?? "Não foi possível concluir a operação.";
}

export function ChargeForm({ chargeId }: { chargeId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [tariff, setTariff] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<FormValues, unknown, ChargeInput>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      vehicle_id: "",
      charged_at: localDateTime(new Date().toISOString()),
      charging_type: "home",
      location_name: "",
      station_id: null,
      energy_kwh: undefined,
      total_cost_brl: undefined,
      distance_km: null,
      notes: "",
    },
  });
  const chargingType = useWatch({
    control: form.control,
    name: "charging_type",
  });
  const energy = useWatch({ control: form.control, name: "energy_kwh" });
  const estimatedCost = useMemo(
    () =>
      tariff !== null && typeof energy === "number" && energy > 0
        ? tariff * energy
        : null,
    [energy, tariff],
  );

  useEffect(() => {
    void Promise.all([
      fetch("/api/vehicles", { cache: "no-store" }),
      fetch("/api/settings", { cache: "no-store" }),
      chargeId
        ? fetch(`/api/charges/${chargeId}`, { cache: "no-store" })
        : Promise.resolve(null),
    ])
      .then(async ([vehicleResponse, settingsResponse, chargeResponse]) => {
        if (!vehicleResponse.ok)
          throw new Error(await errorMessage(vehicleResponse));
        if (!settingsResponse.ok)
          throw new Error(await errorMessage(settingsResponse));
        const [vehicleData, settingsData] = await Promise.all([
          vehicleResponse.json(),
          settingsResponse.json(),
        ]);
        setVehicles(vehicleData as VehicleOption[]);
        setTariff((settingsData as SettingsRecord).home_tariff_brl_kwh);
        if (chargeResponse) {
          if (!chargeResponse.ok)
            throw new Error(await errorMessage(chargeResponse));
          const record = (await chargeResponse.json()) as ChargeRecord;
          form.reset({
            ...record,
            charged_at: localDateTime(record.charged_at),
            location_name: record.location_name ?? "",
            notes: record.notes ?? "",
            distance_km: record.distance_km,
          });
        } else if (vehicleData.length > 0) {
          form.setValue("vehicle_id", (vehicleData as VehicleOption[])[0].id);
          const stationId = Number(searchParams.get("stationId"));
          if (Number.isSafeInteger(stationId) && stationId > 0) {
            form.setValue("station_id", stationId);
            form.setValue("charging_type", "public");
            form.setValue(
              "location_name",
              searchParams.get("stationName") ?? "",
            );
          }
        }
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o formulário.",
        ),
      )
      .finally(() => setLoading(false));
  }, [chargeId, form, searchParams]);

  async function save(values: ChargeInput) {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...values,
        charged_at: new Date(values.charged_at).toISOString(),
        location_name: values.location_name || null,
        station_id: values.station_id || null,
        distance_km:
          values.distance_km === null || Number.isNaN(values.distance_km)
            ? null
            : values.distance_km,
        notes: values.notes || null,
      };
      const response = await fetch(
        chargeId ? `/api/charges/${chargeId}` : "/api/charges",
        {
          method: chargeId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw new Error(await errorMessage(response));
      router.push("/recargas");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a recarga.",
      );
    } finally {
      setSaving(false);
    }
  }

  function applyHomeTariff() {
    if (estimatedCost === null) return;
    form.setValue("total_cost_brl", Number(estimatedCost.toFixed(2)), {
      shouldValidate: true,
    });
  }

  if (loading)
    return <div className="panel empty-state">Carregando formulário...</div>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">HISTÓRICO DE ENERGIA</p>
          <h1>{chargeId ? "Editar recarga" : "Registrar recarga"}</h1>
          <p>Informe apenas os dados conhecidos. Distância é opcional.</p>
        </div>
        <Link className="button button-outline" href="/recargas">
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {vehicles.length === 0 ? (
        <div className="panel empty-state">
          <div>
            <span className="empty-icon">
              <Zap size={19} />
            </span>
            <strong>Cadastre um veículo antes</strong>
            <p>
              Uma recarga precisa estar associada a um veículo da sua conta.
            </p>
            <Link className="button button-primary" href="/veiculos">
              Cadastrar veículo
            </Link>
          </div>
        </div>
      ) : (
        <section className="form-card">
          <form onSubmit={form.handleSubmit(save)}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="vehicle_id">Veículo</label>
                <select id="vehicle_id" {...form.register("vehicle_id")}>
                  <option value="">Selecione</option>
                  {vehicles.map((vehicle) => (
                    <option value={vehicle.id} key={vehicle.id}>
                      {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
                {form.formState.errors.vehicle_id && (
                  <small className="field-hint">
                    {form.formState.errors.vehicle_id.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="charged_at">Data e hora</label>
                <input
                  id="charged_at"
                  type="datetime-local"
                  {...form.register("charged_at")}
                />
                {form.formState.errors.charged_at && (
                  <small className="field-hint">
                    {form.formState.errors.charged_at.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="charging_type">Tipo de recarga</label>
                <select id="charging_type" {...form.register("charging_type")}>
                  <option value="home">Residencial</option>
                  <option value="public">Pública</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="location_name">Local</label>
                <input
                  id="location_name"
                  {...form.register("location_name")}
                  placeholder={
                    chargingType === "home"
                      ? "Ex.: Casa"
                      : "Nome do local ou eletroposto"
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="energy_kwh">Energia carregada (kWh)</label>
                <input
                  id="energy_kwh"
                  type="number"
                  min="0.001"
                  step="0.001"
                  {...form.register("energy_kwh", { valueAsNumber: true })}
                />
                {form.formState.errors.energy_kwh && (
                  <small className="field-hint">
                    {form.formState.errors.energy_kwh.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="total_cost_brl">Valor total (R$)</label>
                <input
                  id="total_cost_brl"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("total_cost_brl", { valueAsNumber: true })}
                />
                {chargingType === "home" && (
                  <button
                    className="text-link"
                    type="button"
                    onClick={applyHomeTariff}
                    disabled={estimatedCost === null}
                  >
                    Usar tarifa cadastrada
                    {tariff !== null ? ` (R$ ${tariff.toFixed(4)}/kWh)` : ""}
                  </button>
                )}
                {form.formState.errors.total_cost_brl && (
                  <small className="field-hint">
                    {form.formState.errors.total_cost_brl.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="distance_km">
                  Distância desde a recarga anterior (km)
                </label>
                <input
                  id="distance_km"
                  type="number"
                  min="0"
                  step="0.1"
                  {...form.register("distance_km", {
                    setValueAs: (value: string) =>
                      value === "" ? null : Number(value),
                  })}
                  placeholder="Opcional"
                />
                {form.formState.errors.distance_km && (
                  <small className="field-hint">
                    {form.formState.errors.distance_km.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="station_id">ID do eletroposto (opcional)</label>
                <input
                  id="station_id"
                  type="number"
                  min="1"
                  step="1"
                  {...form.register("station_id", {
                    setValueAs: (value: string) =>
                      value === "" ? null : Number(value),
                  })}
                  placeholder="Open Charge Map"
                />
              </div>
              <div className="field field-full">
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Anotações opcionais sobre esta recarga"
                />
              </div>
            </div>
            {chargingType === "home" && estimatedCost !== null && (
              <p className="form-note" style={{ marginTop: 16 }}>
                Estimativa com tarifa cadastrada: R$ {estimatedCost.toFixed(2)}.
                O valor não é salvo até você aplicar; você pode editá-lo
                manualmente.
              </p>
            )}
            <div className="form-actions">
              <Link className="button button-quiet" href="/recargas">
                Cancelar
              </Link>
              <button
                className="button button-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : chargeId
                    ? "Salvar alterações"
                    : "Registrar recarga"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
