import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recalculateTable } from "../table-calculator";

vi.mock("@/lib/fussballde/font-decoder", () => ({
  decodeObfuscatedText: vi.fn(async () => "-"),
}));

import { loadCompetitionFromUrl } from "./legacy";

const sampleLegacyHtml = readFileSync(new URL("../../../../samples/fussballde/html/legacy.html", import.meta.url), "utf8");
const duplicateByeHtml = `
  <html>
    <body>
      <script>
        edWettbewerbId='TESTCOMP';
        edWettbewerbName='Testliga';
        edSaison='2526';
        edVerbandName='Niederrhein';
        edMannschaftsartName='Herren';
        edSpielklasseName='Kreisliga B';
        edGebietName='Kreis Essen';
        edWettbewerbUrl='/wettbewerb/test/staffel/TESTCOMP';
      </script>
      <select name="spieltag">
        <option selected data-href="/spieltag/test/staffel/TESTCOMP/spieltag/1">1. Spieltag</option>
      </select>
      <table id="fixture-league-tables">
        <tbody>
          <tr>
            <td class="column-rank">1</td>
            <td class="column-club">
              <a href="/mannschaft/team-a/team-id/TEAMA">
                <div class="club-logo"><img src="/logo-a.png" /></div>
                <div class="club-name">Team A</div>
              </a>
            </td>
            <td></td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0:0</td>
            <td>0</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
      <table class="table table-striped table-full-width thead">
        <tbody>
          <tr>
            <td class="column-date"></td>
            <td class="column-club">
              <a href="/mannschaft/team-a/team-id/TEAMA" class="club-wrapper">
                <div class="club-name">Team A</div>
              </a>
            </td>
            <td class="strong no-border no-padding">:</td>
            <td class="column-club no-border"><span class="info-text">spielfrei</span></td>
            <td class="column-score"></td>
            <td class="column-detail"></td>
          </tr>
          <tr>
            <td class="column-date"></td>
            <td class="column-club">
              <a href="/mannschaft/team-a/team-id/TEAMA" class="club-wrapper">
                <div class="club-name">Team A</div>
              </a>
            </td>
            <td class="strong no-border no-padding">:</td>
            <td class="column-club no-border"><span class="info-text">spielfrei</span></td>
            <td class="column-score"></td>
            <td class="column-detail"></td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
`;

describe("loadCompetitionFromUrl", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(sampleLegacyHtml, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads team logo URLs from the imported original table", async () => {
    const competition = await loadCompetitionFromUrl(
      "https://www.fussball.de/spieltag/test/staffel/02TMJM5PBK00000AVS5489BUVSSD35NB-G#!/",
    );

    expect(competition.importedTable[0]?.teamLogoUrl).toBe(
      "https://www.fussball.de/export.media/-/action/getLogo/format/0/id/00ES8GN8VS0000BDVV0AG08LVUPGND5I/verband/0123456789ABCDEF0123456700004110",
    );
    expect(competition.importedTable.every((row) => row.teamLogoUrl)).toBe(true);
    expect(
      recalculateTable(competition, {}).map((row) => ({
        teamId: row.teamId,
        rank: row.rank,
        points: row.points,
        goalDifference: row.goalDifference,
      })),
    ).toEqual(
      competition.importedTable.map((row) => ({
        teamId: row.teamId,
        rank: row.rank,
        points: row.points,
        goalDifference: row.goalDifference,
      })),
    );
  });

  it("reads fussball.de promotion and relegation row markers from the imported table", async () => {
    const competition = await loadCompetitionFromUrl(
      "https://www.fussball.de/spieltag/test/staffel/02TMJM5PBK00000AVS5489BUVSSD35NB-G#!/",
    );

    expect(competition.importedTable.slice(0, 2).map((row) => row.tableZone)).toEqual([
      "promotion",
      "promotion",
    ]);
    expect(competition.importedTable.slice(-2).map((row) => row.tableZone)).toEqual([
      "relegation",
      "relegation",
    ]);
  });

  it("reads fussball.de playoff row markers from the imported table", async () => {
    fetchMock.mockImplementation(async () =>
      new Response(
        sampleLegacyHtml
          .replace('class="row-promotion"', 'class="row-promotion-playoff"')
          .replace('class="row-relegation"', 'class="row-relegation-playoff"'),
        { status: 200 },
      ),
    );

    const competition = await loadCompetitionFromUrl(
      "https://www.fussball.de/spieltag/test/staffel/02TMJM5PBK00000AVS5489BUVSSD35NB-G#!/",
    );

    expect(competition.importedTable[0]?.tableZone).toBe("promotion-playoff");
    expect(competition.importedTable.at(-2)?.tableZone).toBe("relegation-playoff");
  });

  it("canonicalizes supported next.fussball.de imports to legacy staffel URLs", async () => {
    await loadCompetitionFromUrl("https://next.fussball.de/wettbewerb/-/02TMJM5PBK00000AVS5489BUVSSD35NB-G/tabelle");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://www.fussball.de/spieltag/-/staffel/02TMJM5PBK00000AVS5489BUVSSD35NB-G",
    );
  });

  it("rejects unsupported import hosts before any fetch", async () => {
    await expect(loadCompetitionFromUrl("https://localhost/internal")).rejects.toEqual(
      expect.objectContaining({
        status: 400,
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps repeated bye fixtures uniquely addressable", async () => {
    fetchMock.mockImplementation(async () => new Response(duplicateByeHtml, { status: 200 }));

    const competition = await loadCompetitionFromUrl(
      "https://www.fussball.de/spieltag/test/staffel/TESTCOMP#!/",
    );
    const ids = competition.matchdays[0]?.matches.map((match) => match.id) ?? [];

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("retries a transient landing-page failure before succeeding", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(duplicateByeHtml, { status: 200 }));

    const competition = await loadCompetitionFromUrl(
      "https://www.fussball.de/spieltag/test/staffel/TESTCOMP#!/",
    );

    expect(competition.id).toBe("TESTCOMP");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails clearly when required numeric table cells are no longer readable", async () => {
    const malformedTableHtml = duplicateByeHtml.replace("<td>0:0</td>", "<td>-</td>");
    fetchMock.mockImplementation(async () => new Response(malformedTableHtml, { status: 200 }));

    await expect(
      loadCompetitionFromUrl("https://www.fussball.de/spieltag/test/staffel/TESTCOMP#!/"),
    ).rejects.toThrow("Tabellenzeile für 'Team A': Tore konnte nicht gelesen werden.");
  });
});
