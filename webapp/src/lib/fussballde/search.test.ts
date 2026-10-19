import { afterEach, describe, expect, it, vi } from "vitest";
import { clearUpstreamMemoryCache } from "./request";
import { getCompetitionOptions, getSearchBootstrap } from "./search";

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });
}

afterEach(() => {
  clearUpstreamMemoryCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getSearchBootstrap", () => {
  it("uses the cup type for both filter and competition endpoints", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ currentSaison: "2627", Mandanten: { _22: "Niederrhein" }, Saisons: { "22": { _2627: "26/27" } } }))
      .mockResolvedValueOnce(jsonResponse({ Mannschaftsart: { _343: "Herren" }, Spielklasse: { "343": { _117: "Kreispokal" } }, Gebiet: { "343": { "117": { _essen: "Essen" } } } }))
      .mockResolvedValueOnce(jsonResponse({ "117": { essen: { "_/spieltagsuebersicht/-/staffel/CUP-C": "Kreispokal" } } }));
    vi.stubGlobal("fetch", fetchMock);
    const bootstrap = await getSearchBootstrap({ competitionTypeId: "308" });
    expect(bootstrap.defaults.competitionTypeId).toBe("308");
    const options = await getCompetitionOptions(bootstrap.defaults);
    expect(String(fetchMock.mock.calls[1][0])).toContain("wam_kinds_22_2627_308.json");
    expect(String(fetchMock.mock.calls[2][0])).toContain("wam_competitions_22_2627_308_343_117_essen.json");
    expect(options).toEqual([{ label: "Kreispokal", url: "/spieltag/-/staffel/CUP-C" }]);
  });
  it("retries a transient WAM failure before succeeding", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503 }))
      .mockResolvedValueOnce(
        jsonResponse({
          currentSaison: "2526",
          Mandanten: {
            _22: "Niederrhein",
          },
          Saisons: {
            "22": {
              _2526: "25/26",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          Mannschaftsart: {
            _343: "Herren",
          },
          Spielklasse: {
            "343": {
              _120: "Kreisliga B",
            },
          },
          Gebiet: {
            "343": {
              "120": {
                _area: "Kreis Essen",
              },
            },
          },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const bootstrap = await getSearchBootstrap({});

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(bootstrap.defaults).toEqual({
      competitionTypeId: "1",
      associationId: "22",
      seasonId: "2526",
      teamTypeId: "343",
      leagueId: "120",
      areaId: "area",
    });
    expect(bootstrap.areas).toEqual([{ id: "area", label: "Kreis Essen" }]);
  });

  it("returns a partial bootstrap instead of requesting invalid kinds URLs", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        currentSaison: "2526",
        Mandanten: {
          _22: "Niederrhein",
        },
        Saisons: {
          "22": {},
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const bootstrap = await getSearchBootstrap({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bootstrap.seasons).toEqual([]);
    expect(bootstrap.teamTypes).toEqual([]);
    expect(bootstrap.leagues).toEqual([]);
    expect(bootstrap.areas).toEqual([]);
    expect(bootstrap.defaults).toEqual({
      competitionTypeId: "1",
      associationId: "22",
      seasonId: "",
      teamTypeId: "",
      leagueId: "",
      areaId: "",
    });
  });

  it("surfaces a clear error after repeated upstream failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("still unavailable", { status: 503 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getSearchBootstrap({})).rejects.toThrow(
      "Der Such-Endpunkt 'wam_base.json' konnte nicht geladen werden (503).",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
