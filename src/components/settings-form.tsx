"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CircleDollarSign } from "lucide-react";
import { settingsSchema, type SettingsInput } from "@/lib/validation";

type SettingsData = {
  home_tariff_brl_kwh: number | null;
  gasoline_price_brl_liter: number | null;
  gasoline_efficiency_km_liter: number | null;
};

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const form = useForm<SettingsInput, unknown, SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      home_tariff_brl_kwh: undefined,
      gasoline_price_brl_liter: null,
      gasoline_efficiency_km_liter: null,
    },
  });

  useEffect(() => {
    void fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.error ?? "Não foi possível carregar as configurações.",
          );
        const values = body as SettingsData;
        form.reset({
          home_tariff_brl_kwh: values.home_tariff_brl_kwh ?? undefined,
          gasoline_price_brl_liter: values.gasoline_price_brl_liter ?? null,
          gasoline_efficiency_km_liter:
            values.gasoline_efficiency_km_liter ?? null,
        });
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Erro ao carregar configurações.",
        ),
      )
      .finally(() => setLoading(false));
  }, [form]);

  async function save(values: SettingsInput) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error ?? "Não foi possível salvar as configurações.",
        );
      setMessage("Configurações salvas.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erro ao salvar configurações.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PREFERÊNCIAS E PREMISSAS</p>
          <h1>Configurações</h1>
          <p>
            Defina seus valores para calcular custos e comparar com gasolina.
          </p>
        </div>
      </div>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="alert alert-success">{message}</p>}
      <section className="form-card">
        <div className="panel-heading">
          <div>
            <h2>Parâmetros financeiros</h2>
            <p>
              Esses valores são informados por você e podem ser alterados a
              qualquer momento.
            </p>
          </div>
          <span className="metric-icon">
            <CircleDollarSign size={17} />
          </span>
        </div>
        {loading ? (
          <p className="muted-text">Carregando suas configurações...</p>
        ) : (
          <form onSubmit={form.handleSubmit(save)}>
            <div className="form-grid">
              <div className="field field-full">
                <label htmlFor="home_tariff_brl_kwh">
                  Tarifa residencial (R$/kWh)
                </label>
                <input
                  id="home_tariff_brl_kwh"
                  type="number"
                  min="0"
                  step="0.0001"
                  {...form.register("home_tariff_brl_kwh", {
                    valueAsNumber: true,
                  })}
                />
                <small className="field-hint">
                  Use o valor efetivo da sua conta de energia. A tarifa é
                  utilizada para estimar recargas em casa.
                </small>
                {form.formState.errors.home_tariff_brl_kwh && (
                  <small className="field-hint">
                    {form.formState.errors.home_tariff_brl_kwh.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="gasoline_price_brl_liter">
                  Preço da gasolina (R$/litro)
                </label>
                <input
                  id="gasoline_price_brl_liter"
                  type="number"
                  min="0"
                  step="0.001"
                  {...form.register("gasoline_price_brl_liter", {
                    setValueAs: (value: string) =>
                      value === "" ? null : Number(value),
                  })}
                />
                {form.formState.errors.gasoline_price_brl_liter && (
                  <small className="field-hint">
                    {form.formState.errors.gasoline_price_brl_liter.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="gasoline_efficiency_km_liter">
                  Consumo do carro a gasolina (km/l)
                </label>
                <input
                  id="gasoline_efficiency_km_liter"
                  type="number"
                  min="0.1"
                  step="0.1"
                  {...form.register("gasoline_efficiency_km_liter", {
                    setValueAs: (value: string) =>
                      value === "" ? null : Number(value),
                  })}
                />
                {form.formState.errors.gasoline_efficiency_km_liter && (
                  <small className="field-hint">
                    {form.formState.errors.gasoline_efficiency_km_liter.message}
                  </small>
                )}
              </div>
            </div>
            <p className="form-note" style={{ marginTop: 16 }}>
              A comparação com gasolina é uma estimativa com base nas premissas
              informadas. CargaCE não consulta nem valida preços externos de
              combustíveis.
            </p>
            <div className="form-actions">
              <button
                className="button button-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
