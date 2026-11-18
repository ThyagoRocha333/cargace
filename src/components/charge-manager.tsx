"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BatteryCharging, Pencil, Plus, Trash2 } from "lucide-react";

type ChargeRow = {
  id: string;
  vehicle_id: string;
  charged_at: string;
  charging_type: "home" | "public";
  location_name: string | null;
  energy_kwh: number;
  total_cost_brl: number;
  distance_km: number | null;
  notes: string | null;
  vehicles:
    { make: string; model: string } | { make: string; model: string }[] | null;
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Fortaleza",
});

export function ChargeManager() {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/charges", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Não foi possível carregar as recargas.");
      setCharges(body as ChargeRow[]);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar as recargas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/charges", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.error ?? "Não foi possível carregar as recargas.",
          );
        return body as ChargeRow[];
      })
      .then((data) => {
        if (active) setCharges(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar as recargas.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(charge: ChargeRow) {
    if (
      !window.confirm("Excluir esta recarga? Esta ação não pode ser desfeita.")
    )
      return;
    try {
      const response = await fetch(`/api/charges/${charge.id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Não foi possível excluir a recarga.");
      setMessage("Recarga excluída.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir a recarga.",
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SEU HISTÓRICO DE ENERGIA</p>
          <h1>Minhas recargas</h1>
          <p>Acompanhe os registros feitos na sua conta.</p>
        </div>
        <Link className="button button-primary" href="/recargas/nova">
          <Plus size={15} /> Registrar recarga
        </Link>
      </div>
      {message && <p className="alert alert-success">{message}</p>}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="panel empty-state">Carregando recargas...</div>
      ) : charges.length === 0 ? (
        <div className="panel empty-state">
          <div>
            <span className="empty-icon">
              <BatteryCharging size={20} />
            </span>
            <strong>Nenhuma recarga registrada</strong>
            <p>Adicione sua primeira recarga para acompanhar os gastos.</p>
            <Link className="button button-primary" href="/recargas/nova">
              Registrar recarga
            </Link>
          </div>
        </div>
      ) : (
        <div className="list-stack">
          {charges.map((charge) => {
            const vehicle = Array.isArray(charge.vehicles)
              ? charge.vehicles[0]
              : charge.vehicles;
            return (
              <article className="list-card" key={charge.id}>
                <div className="list-main">
                  <span className="list-icon">
                    <BatteryCharging size={18} />
                  </span>
                  <div>
                    <p className="list-title">
                      {charge.location_name ||
                        (charge.charging_type === "home"
                          ? "Recarga residencial"
                          : "Recarga pública")}
                    </p>
                    <p className="list-subtitle">
                      {date.format(new Date(charge.charged_at))} ·{" "}
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : "Veículo"}
                    </p>
                  </div>
                </div>
                <div className="list-details">
                  <span>{decimal.format(charge.energy_kwh)} kWh</span>
                  <strong>{brl.format(charge.total_cost_brl)}</strong>
                  {charge.distance_km !== null && (
                    <span>{decimal.format(charge.distance_km)} km</span>
                  )}
                </div>
                <div className="list-controls">
                  <Link
                    className="icon-button"
                    href={`/recargas/${charge.id}/editar`}
                    aria-label="Editar recarga"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => void remove(charge)}
                    aria-label="Excluir recarga"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
