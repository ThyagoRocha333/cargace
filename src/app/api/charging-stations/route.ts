import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const BASE_URL = "https://api.openchargemap.io/v3/poi/";
const FORTALEZA = { latitude: -3.7319, longitude: -38.5267 };

type OcmConnection = {
  Type?: { Title?: string | null } | null;
  Level?: {
    Title?: string | null;
    Amps?: number | null;
    Voltage?: number | null;
  } | null;
  PowerKW?: number | null;
  CurrentType?: { Title?: string | null } | null;
};

type OcmStation = {
  ID?: number;
  UUID?: string | null;
  AddressInfo?: {
    Title?: string | null;
    AddressLine1?: string | null;
    Town?: string | null;
    StateOrProvince?: string | null;
    Latitude?: number | null;
    Longitude?: number | null;
  } | null;
  OperatorInfo?: { Title?: string | null } | null;
  Connections?: OcmConnection[] | null;
  UsageCost?: string | null;
  StatusType?: { Title?: string | null; IsOperational?: boolean | null } | null;
  DateLastStatusUpdate?: string | null;
};

export async function GET() {
  const key = process.env.OPEN_CHARGE_MAP_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Consulta de eletropostos indisponível: configure OPEN_CHARGE_MAP_API_KEY no servidor.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const query = new URLSearchParams({
    output: "json",
    latitude: String(FORTALEZA.latitude),
    longitude: String(FORTALEZA.longitude),
    distance: "35",
    distanceunit: "KM",
    maxresults: "100",
    compact: "true",
    verbose: "false",
    key,
  });
  try {
    const response = await fetch(`${BASE_URL}?${query}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `A fonte Open Charge Map retornou erro (${response.status}). Tente novamente mais tarde.`,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: "A fonte Open Charge Map retornou uma resposta inesperada." },
        { status: 502 },
      );
    }
    const stations = (payload as OcmStation[]).flatMap((station) => {
      const address = station.AddressInfo;
      const latitude = address?.Latitude;
      const longitude = address?.Longitude;
      if (
        !address ||
        typeof station.ID !== "number" ||
        typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        typeof longitude !== "number" ||
        !Number.isFinite(longitude)
      )
        return [];
      const cost = station.UsageCost?.trim() || null;
      return [
        {
          id: station.ID,
          uuid: station.UUID ?? null,
          name: address.Title?.trim() || null,
          address:
            [address.AddressLine1, address.Town, address.StateOrProvince]
              .filter(Boolean)
              .join(", ") || null,
          latitude,
          longitude,
          operator: station.OperatorInfo?.Title?.trim() || null,
          connectors: (station.Connections ?? []).map((connection) => ({
            type: connection.Type?.Title?.trim() || null,
            powerKw: connection.PowerKW ?? null,
            currentType: connection.CurrentType?.Title?.trim() || null,
            level: connection.Level?.Title?.trim() || null,
          })),
          price: cost,
          priceKnown: cost !== null,
          freeConfirmed: cost !== null && /\bfree\b|no charge/i.test(cost),
          operationalStatus: station.StatusType?.Title?.trim() || null,
          operational: station.StatusType?.IsOperational ?? null,
          sourceUpdatedAt: station.DateLastStatusUpdate ?? null,
        },
      ];
    });

    return NextResponse.json(
      {
        stations,
        meta: {
          source: "Open Charge Map",
          retrievedAt: new Date().toISOString(),
          cacheSeconds: 300,
          limitation:
            "Dados colaborativos da fonte; status e preços podem estar desatualizados e não representam disponibilidade em tempo real.",
          center: FORTALEZA,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível consultar a Open Charge Map. Verifique a conexão e tente novamente.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
