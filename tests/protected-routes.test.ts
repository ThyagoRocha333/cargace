import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getCharges,
  POST as createCharge,
} from "../src/app/api/charges/route";
import {
  DELETE as deleteCharge,
  GET as getCharge,
  PATCH as updateCharge,
} from "../src/app/api/charges/[id]/route";
import {
  GET as getSettings,
  PUT as updateSettings,
} from "../src/app/api/settings/route";
import {
  DELETE as deleteVehicle,
  PATCH as updateVehicle,
} from "../src/app/api/vehicles/[id]/route";
import {
  GET as getVehicles,
  POST as createVehicle,
} from "../src/app/api/vehicles/route";
import { authenticatedClient } from "../src/lib/api-auth";

const { createClientMock, configuredMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  configuredMock: vi.fn(() => true),
}));

vi.mock("../src/lib/supabase/server", () => ({
  createClient: createClientMock,
  isSupabaseConfigured: configuredMock,
}));

const id = "c04d0b93-d397-4e8d-a5af-161ee68355d8";
const routeParams = { params: Promise.resolve({ id }) };
const request = (method: string) =>
  new Request("http://localhost/api/test", {
    method,
    ...(method === "GET" ? {} : { body: "{}" }),
  });

describe("autenticação de rotas privadas", () => {
  beforeEach(() => {
    configuredMock.mockReturnValue(true);
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });
  });

  it("nega operações de leitura e escrita sem sessão", async () => {
    const responses = await Promise.all([
      getVehicles(),
      createVehicle(request("POST")),
      updateVehicle(request("PATCH"), routeParams),
      deleteVehicle(request("DELETE"), routeParams),
      getCharges(),
      createCharge(request("POST")),
      getCharge(request("GET"), routeParams),
      updateCharge(request("PATCH"), routeParams),
      deleteCharge(request("DELETE"), routeParams),
      getSettings(),
      updateSettings(request("PUT")),
    ]);

    expect(responses.map((response) => response.status)).toEqual(
      Array(responses.length).fill(401),
    );
    expect(createClientMock).toHaveBeenCalledTimes(responses.length);
  });

  it("retorna indisponibilidade sem tentar criar cliente quando Supabase falta", async () => {
    configuredMock.mockReturnValue(false);

    const result = await authenticatedClient();

    expect("response" in result && result.response.status).toBe(503);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("associa o cliente autenticado ao identificador retornado pelo Supabase", async () => {
    const userId = "9a11fb19-f840-4ed8-b1e3-e71e67f51f50";
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
    });

    const result = await authenticatedClient();

    expect("userId" in result && result.userId).toBe(userId);
  });
});
