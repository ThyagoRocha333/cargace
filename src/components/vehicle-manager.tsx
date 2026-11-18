"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { CarFront, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vehicleSchema, type VehicleInput } from "@/lib/validation";

type Vehicle = VehicleInput & { id: string; created_at: string };
const emptyVehicle: DefaultValues<VehicleInput> = {
  make: "",
  model: "",
  year: undefined,
  battery_capacity_kwh: undefined,
  estimated_consumption_kwh_100km: null,
  connector_type: "",
};

async function responseError(response: Response) {
  const body: { error?: string } = await response.json();
  return body.error ?? "Não foi possível concluir a operação.";
}

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const form = useForm<VehicleInput, unknown, VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyVehicle,
  });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      setVehicles((await response.json()) as Vehicle[]);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os veículos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/vehicles", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return (await response.json()) as Vehicle[];
      })
      .then((data) => {
        if (active) setVehicles(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os veículos.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function startCreate() {
    setEditing(null);
    form.reset(emptyVehicle);
    setShowForm(true);
    setMessage("");
  }

  function startEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    form.reset(vehicle);
    setShowForm(true);
    setMessage("");
  }

  async function save(values: VehicleInput) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        editing ? `/api/vehicles/${editing.id}` : "/api/vehicles",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            estimated_consumption_kwh_100km:
              values.estimated_consumption_kwh_100km || null,
            connector_type: values.connector_type || null,
          }),
        },
      );
      if (!response.ok) throw new Error(await responseError(response));
      setShowForm(false);
      setMessage(editing ? "Veículo atualizado." : "Veículo cadastrado.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o veículo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(vehicle: Vehicle) {
    if (!window.confirm(`Excluir ${vehicle.make} ${vehicle.model}?`)) return;
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseError(response));
      setMessage("Veículo excluído.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o veículo.",
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SUA GARAGEM</p>
          <h1>Meus veículos</h1>
          <p>Cadastre os veículos associados às suas recargas.</p>
        </div>
        <Button
          className="button button-primary"
          type="button"
          onClick={startCreate}
        >
          <Plus size={15} /> Adicionar veículo
        </Button>
      </div>
      {message && <p className="alert alert-success">{message}</p>}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {showForm && (
        <section className="form-card" style={{ marginBottom: 15 }}>
          <div className="panel-heading">
            <div>
              <h2>{editing ? "Editar veículo" : "Novo veículo"}</h2>
              <p>Os campos são privados da sua conta.</p>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Fechar formulário"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={form.handleSubmit(save)}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="make">Fabricante</label>
                <input
                  id="make"
                  {...form.register("make")}
                  placeholder="Ex.: BYD"
                />
                {form.formState.errors.make && (
                  <small className="field-hint">
                    {form.formState.errors.make.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="model">Modelo</label>
                <input
                  id="model"
                  {...form.register("model")}
                  placeholder="Ex.: Dolphin"
                />
                {form.formState.errors.model && (
                  <small className="field-hint">
                    {form.formState.errors.model.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="year">Ano</label>
                <input
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                />
                {form.formState.errors.year && (
                  <small className="field-hint">
                    {form.formState.errors.year.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="battery_capacity_kwh">
                  Capacidade da bateria (kWh)
                </label>
                <input
                  id="battery_capacity_kwh"
                  type="number"
                  step="0.1"
                  {...form.register("battery_capacity_kwh", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.battery_capacity_kwh && (
                  <small className="field-hint">
                    {form.formState.errors.battery_capacity_kwh.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="estimated_consumption_kwh_100km">
                  Consumo estimado (kWh/100 km)
                </label>
                <input
                  id="estimated_consumption_kwh_100km"
                  type="number"
                  step="0.1"
                  {...form.register("estimated_consumption_kwh_100km", {
                    setValueAs: (value: string) =>
                      value === "" ? null : Number(value),
                  })}
                  placeholder="Opcional"
                />
              </div>
              <div className="field">
                <label htmlFor="connector_type">Tipo de conector</label>
                <input
                  id="connector_type"
                  {...form.register("connector_type")}
                  placeholder="Ex.: Tipo 2, CCS2"
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                className="button button-quiet"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                className="button button-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar veículo"}
              </button>
            </div>
          </form>
        </section>
      )}
      {loading ? (
        <div className="panel empty-state">Carregando veículos...</div>
      ) : vehicles.length === 0 ? (
        <div className="panel empty-state">
          <div>
            <span className="empty-icon">
              <CarFront size={20} />
            </span>
            <strong>Nenhum veículo cadastrado</strong>
            <p>
              Adicione seu primeiro veículo para começar a registrar recargas.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={startCreate}
            >
              Cadastrar veículo
            </button>
          </div>
        </div>
      ) : (
        <div className="list-stack">
          {vehicles.map((vehicle) => (
            <article className="list-card" key={vehicle.id}>
              <div className="list-main">
                <span className="list-icon">
                  <CarFront size={18} />
                </span>
                <div>
                  <p className="list-title">
                    {vehicle.make} {vehicle.model} · {vehicle.year}
                  </p>
                  <p className="list-subtitle">
                    {vehicle.battery_capacity_kwh} kWh de bateria
                    {vehicle.connector_type
                      ? ` · ${vehicle.connector_type}`
                      : ""}
                    {vehicle.estimated_consumption_kwh_100km
                      ? ` · ${vehicle.estimated_consumption_kwh_100km} kWh/100 km`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="list-controls">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => startEdit(vehicle)}
                  aria-label={`Editar ${vehicle.model}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => void remove(vehicle)}
                  aria-label={`Excluir ${vehicle.model}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
