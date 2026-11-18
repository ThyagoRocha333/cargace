import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/charging-stations/route";

describe("API Open Charge Map", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("informa claramente quando a chave não está configurada", async () => {
    vi.stubEnv("OPEN_CHARGE_MAP_API_KEY", "");
    const response = await GET();
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("OPEN_CHARGE_MAP_API_KEY");
  });

  it("expõe erro de origem sem retornar dados simulados", async () => {
    vi.stubEnv("OPEN_CHARGE_MAP_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 429 })),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain("429");
  });

  it("normaliza apenas estações válidas e inclui origem/limitações", async () => {
    vi.stubEnv("OPEN_CHARGE_MAP_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              ID: 123,
              AddressInfo: {
                Title: "Estação reportada",
                Latitude: -3.73,
                Longitude: -38.52,
              },
              Connections: [
                {
                  Type: { Title: "Type 2" },
                  PowerKW: 22,
                  CurrentType: { Title: "AC" },
                },
              ],
              UsageCost: null,
            },
            { ID: 124, AddressInfo: { Latitude: null, Longitude: null } },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.stations).toHaveLength(1);
    expect(body.stations[0]).toMatchObject({
      id: 123,
      name: "Estação reportada",
      price: null,
      priceKnown: false,
      connectors: [{ type: "Type 2", powerKw: 22, currentType: "AC" }],
    });
    expect(body.meta.source).toBe("Open Charge Map");
    expect(body.meta.limitation).toContain("tempo real");
  });
});
