"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, PlugZap, RefreshCw } from "lucide-react";

type Station = {
  id: number;
  uuid: string | null;
  name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  operator: string | null;
  connectors: {
    type: string | null;
    powerKw: number | null;
    currentType: string | null;
    level: string | null;
  }[];
  price: string | null;
  priceKnown: boolean;
  freeConfirmed: boolean;
  operationalStatus: string | null;
  operational: boolean | null;
  sourceUpdatedAt: string | null;
};

type MapPayload = {
  stations: Station[];
  meta: { source: string; retrievedAt: string; limitation: string };
};
type Filter = "all" | "AC" | "DC";

const LeafletMap = dynamic(() => import("@/components/station-map-view"), {
  ssr: false,
  loading: () => <div className="map-box empty-state">Carregando mapa...</div>,
});

export function StationMap() {
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [connector, setConnector] = useState("");
  const [minimumPower, setMinimumPower] = useState("");
  const [onlyKnownPrice, setOnlyKnownPrice] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function requestStations() {
    const response = await fetch("/api/charging-stations", {
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error ?? "Não foi possível consultar eletropostos.");
    return body as MapPayload;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      setPayload(await requestStations());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível consultar eletropostos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    requestStations()
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível consultar eletropostos.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      (payload?.stations ?? []).filter((station) => {
        const connectors = station.connectors;
        if (
          filter !== "all" &&
          !connectors.some((item) =>
            item.currentType?.toUpperCase().includes(filter),
          )
        )
          return false;
        if (
          connector &&
          !connectors.some((item) =>
            item.type?.toLowerCase().includes(connector.toLowerCase()),
          )
        )
          return false;
        const min = minimumPower ? Number(minimumPower) : null;
        if (
          min !== null &&
          !connectors.some(
            (item) => item.powerKw !== null && item.powerKw >= min,
          )
        )
          return false;
        if (onlyKnownPrice && !station.priceKnown) return false;
        if (onlyFree && !station.freeConfirmed) return false;
        return true;
      }),
    [connector, filter, minimumPower, onlyFree, onlyKnownPrice, payload],
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FONTES PÚBLICAS</p>
          <h1>Eletropostos em Fortaleza</h1>
          <p>
            Estações reportadas pela Open Charge Map. Não indica disponibilidade
            em tempo real.
          </p>
        </div>
        <button
          className="button button-outline"
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>
      <div className="map-filters" aria-label="Filtros de eletropostos">
        <label className="filter-chip">
          Tipo{" "}
          <select
            aria-label="Tipo de corrente"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="all">Todos</option>
            <option value="AC">AC</option>
            <option value="DC">DC</option>
          </select>
        </label>
        <label className="filter-chip">
          Conector{" "}
          <input
            aria-label="Filtrar conector"
            value={connector}
            onChange={(event) => setConnector(event.target.value)}
            placeholder="Ex.: Type 2"
          />
        </label>
        <label className="filter-chip">
          Potência mínima (kW){" "}
          <input
            aria-label="Potência mínima"
            type="number"
            min="0"
            value={minimumPower}
            onChange={(event) => setMinimumPower(event.target.value)}
            placeholder="Qualquer"
          />
        </label>
        <label className="filter-chip">
          <input
            type="checkbox"
            checked={onlyKnownPrice}
            onChange={(event) => setOnlyKnownPrice(event.target.checked)}
          />{" "}
          Preço conhecido
        </label>
        <label className="filter-chip">
          <input
            type="checkbox"
            checked={onlyFree}
            onChange={(event) => setOnlyFree(event.target.checked)}
          />{" "}
          Gratuitos confirmados
        </label>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}{" "}
          <button
            className="text-link"
            type="button"
            onClick={() => void load()}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="map-layout">
        <section>
          <div className="map-box">
            <LeafletMap
              stations={filtered}
              selectedId={selected?.id ?? null}
              onSelect={(station) =>
                setSelected(
                  payload?.stations.find((item) => item.id === station.id) ??
                    null,
                )
              }
            />
          </div>
          <p className="map-attribution">
            Mapa ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap
            </a>{" "}
            contributors · Pontos:{" "}
            <a
              href="https://openchargemap.org"
              target="_blank"
              rel="noreferrer"
            >
              Open Charge Map
            </a>
          </p>
        </section>
        <aside className="station-panel">
          {selected ? (
            <>
              <button
                className="text-link"
                type="button"
                onClick={() => setSelected(null)}
              >
                ← Voltar à lista
              </button>
              <h2 style={{ marginTop: 16 }}>
                {selected.name ?? "Nome não informado"}
              </h2>
              <p>{selected.address ?? "Endereço não informado"}</p>
              <StationRow
                label="Operador"
                value={selected.operator ?? "Não informado"}
              />
              <StationRow
                label="Conectores"
                value={
                  selected.connectors.length
                    ? selected.connectors
                        .map(
                          (item) =>
                            `${item.type ?? "Não informado"}${item.powerKw !== null ? ` · ${item.powerKw} kW` : ""}${item.currentType ? ` · ${item.currentType}` : ""}`,
                        )
                        .join("; ")
                    : "Não informado"
                }
              />
              <StationRow
                label="Preço reportado"
                value={selected.price ?? "Não informado"}
              />
              <StationRow
                label="Situação reportada"
                value={selected.operationalStatus ?? "Não informado"}
              />
              <StationRow
                label="Atualização da estação"
                value={formatSourceDate(selected.sourceUpdatedAt)}
              />
              <a
                className="button button-primary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={14} /> Como chegar
              </a>
              <Link
                className="button button-outline"
                href={`/recargas/nova?${new URLSearchParams({ stationId: String(selected.id), stationName: selected.name ?? "" }).toString()}`}
                style={{ marginTop: 8 }}
              >
                <PlugZap size={14} /> Registrar recarga aqui
              </Link>
            </>
          ) : (
            <>
              <h2>Estações encontradas</h2>
              <p>
                {loading
                  ? "Consultando fonte..."
                  : `${filtered.length} pontos correspondem aos filtros.`}
              </p>
              {payload?.meta && (
                <p className="source-note">
                  Fonte: {payload.meta.source}
                  <br />
                  Consulta:{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(payload.meta.retrievedAt))}
                  <br />
                  Cache do servidor: até 5 minutos.
                </p>
              )}
              <div className="station-results">
                {filtered.slice(0, 25).map((station) => (
                  <button
                    className="station-result"
                    key={station.id}
                    type="button"
                    onClick={() => setSelected(station)}
                  >
                    <span className="list-icon">
                      <PlugZap size={16} />
                    </span>
                    <span>
                      <b>{station.name ?? "Nome não informado"}</b>
                      <small>
                        {station.operator ?? "Operador não informado"}
                      </small>
                    </span>
                    <MapPin size={13} />
                  </button>
                ))}
                {filtered.length === 0 && !loading && !error && (
                  <div className="empty-state">
                    Nenhuma estação corresponde aos filtros atuais.
                  </div>
                )}
              </div>
            </>
          )}
          {payload?.meta && (
            <p className="source-note">{payload.meta.limitation}</p>
          )}
        </aside>
      </div>
    </>
  );
}

function formatSourceDate(value: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function StationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="station-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
