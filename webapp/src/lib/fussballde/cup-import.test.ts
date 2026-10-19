import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCompetitionFromUrl } from "./legacy";
import { clearUpstreamMemoryCache } from "./request";

vi.mock("@/lib/fussballde/font-decoder", () => ({
  decodeObfuscatedText: vi.fn(async (text: string) => text),
}));

const cupId = "02TQO9IRRK000000VS5489BUVVJ8R9DS-C";
const roundId = "02UPLSSLBG000005VS5489BUVTEK9G46-R";
const finalId = "02VBF807F8000006VS5489BUVVS4GHTL-R";

function page(selected: string, rows: string) {
  return `<script>
    edWettbewerbId='${cupId}'; edWettbewerbName='Testpokal'; edSaison='2526';
    edWettkampfTypName='Pokale'; edWettbewerbTypId='308';
    edWettbewerbUrl='/spieltagsuebersicht/-/staffel/${cupId}';
  </script>
  <select name="dummy">
    <option data-href="/spieltag/-/staffel/${roundId}" ${selected === roundId ? 'selected class="on"' : ""}>KO-Runde - Halbfinale</option>
    <option data-href="/spieltag/-/staffel/${finalId}" ${selected === finalId ? 'selected class="on"' : ""}>KO-Runde - Finale</option>
  </select>
  <table class="table table-striped table-full-width thead"><tbody>${rows}</tbody></table>`;
}

function row(id: string, home: string, guest: string, score: string) {
  const team = (name: string) => name === "spielfrei" || name.startsWith("Sieger")
    ? `<span class="info-text">${name}</span>`
    : `<a href="/mannschaft/-/team-id/${name}"><div class="club-name">${name}</div></a>`;
  return `<tr><td class="column-date">So, 10.05.2026 | 15:00</td>
    <td class="column-club">${team(home)}</td><td>:</td>
    <td class="column-club no-border">${team(guest)}</td>
    <td class="column-score"><a href="/spiel/-/spiel/${id}">${score}</a></td></tr>`;
}

afterEach(() => { clearUpstreamMemoryCache(); vi.unstubAllGlobals(); });

describe("cup import", () => {
  it("imports every named round without requiring a league table", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => new Response(
      String(input).includes(roundId)
        ? page(roundId, row("semi", "A", "B", '5:4<span class="info-text sub"> iE</span>') + row("bye", "spielfrei", "C", ""))
        : page(finalId, row("final", "A", "C", "2:1")),
    ));
    vi.stubGlobal("fetch", fetchMock);
    const cup = await loadCompetitionFromUrl(`https://next.fussball.de/wettbewerb/-/${cupId}/runde`);
    expect(cup.kind).toBe("cup");
    expect(cup.importedTable).toEqual([]);
    expect(cup.tableAdjustments).toEqual({});
    expect(cup.matchdays.map((round) => round.label)).toEqual(["Halbfinale", "Finale"]);
    expect(cup.matchdays[0].matches[0].originalResult).toEqual({ home: 5, guest: 4 });
    expect(cup.matchdays[0].matches[0].resultNote).toBe("iE");
    expect(cup.matchdays[0].matches[0].id).toBe("semi");
    expect(cup.matchdays[0].matches[1].id).toBe("bye");
    expect(cup.matchdays[0].matches[1].isBye).toBe(true);
    expect(cup.matchdays[0].matches[1].guestTeamId).toBe("C");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps empty published rounds and unresolved team slots", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => new Response(
      String(input).includes(roundId)
        ? page(roundId, row("semi", "Sieger Spiel 1", "B", "Abgesagt"))
        : page(finalId, ""),
    )));
    const cup = await loadCompetitionFromUrl(`https://www.fussball.de/spieltag/-/staffel/${cupId}`);
    expect(cup.matchdays[1].matches).toEqual([]);
    expect(cup.matchdays[0].matches[0].homeTeamName).toBe("Sieger Spiel 1");
    expect(cup.matchdays[0].matches[0].homeTeamIsPlaceholder).toBe(true);
    expect(cup.matchdays[0].matches[0].originalResult).toEqual({ home: null, guest: null });
  });

  it("resolves round URLs to the complete parent cup", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(page(finalId, ""))));
    const cup = await loadCompetitionFromUrl(`https://www.fussball.de/spieltag/-/staffel/${finalId}`);
    expect(cup.id).toBe(cupId);
    expect(cup.matchdays).toHaveLength(2);
  });

  it("fetches the full group stage when the input URL shows only one group", async () => {
    const groupId = "02TQO9IRRK000001VS5489BUVVJ8R9DS-G";
    const groupPage = (rows: string) => page(roundId, rows).replace("KO-Runde - Halbfinale", "Gruppenrunde - Vorrunde");
    const fetchMock = vi.fn(async (input: string | URL | Request) => new Response(groupPage(
      String(input).includes(groupId) ? row("one", "A", "B", "1:0")
        : row("one", "A", "B", "1:0") + row("two", "C", "D", "1:2"),
    )));
    vi.stubGlobal("fetch", fetchMock);
    const cup = await loadCompetitionFromUrl(`https://www.fussball.de/spieltag/-/staffel/${groupId}`);
    expect(cup.matchdays[0].stageType).toBe("group");
    expect(cup.matchdays[0].matches).toHaveLength(2);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(roundId))).toBe(true);
  });
});
