import { load } from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { absoluteUrl, parseMatches, parseTeamLogoUrl } from "./legacy-matches";
import { fetchUpstreamText } from "./request";
import { createEmptyTableAdjustment, recalculateTableFromResults } from "../table-calculator";
import type { Competition, Matchday, TableRow, TableZone } from "@/lib/fussballde/types";

const LEGACY_HOST = "https://www.fussball.de";
const SUPPORTED_IMPORT_HOSTS = new Set(["fussball.de", "www.fussball.de", "next.fussball.de"]);
const COMPETITION_PAGE_CACHE_TTL_MS = 5 * 60 * 1000;

type MatchdayOption = {
  number: number;
  label: string;
  url: string;
  selected: boolean;
  stageType?: "knockout" | "group";
};

type CompetitionProfile = {
  kind: Competition["kind"];
  id: string;
  name: string;
  season: string;
  association: string;
  teamType: string;
  leagueLevel: string;
  area: string;
  sourceCompetitionUrl: string;
};

export class CompetitionImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function extractStaffelId(input: string): string | null {
  const explicit = input.match(/staffel\/([^/?#]+)/i);

  if (explicit) {
    return explicit[1];
  }

  const competition = input.match(/\/wettbewerb\/[^?#]*\/([A-Z0-9-]{12,})/i);

  if (competition) {
    return competition[1];
  }

  return null;
}

function extractCanonicalCompetitionId(url: URL): string | null {
  return extractStaffelId(url.pathname) ?? extractStaffelId(url.toString());
}

function normalizeCompetitionImportUrl(input: string): { candidateUrls: string[] } {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(input.trim());
  } catch {
    throw new CompetitionImportError("Die Wettbewerbs-URL ist ungültig.", 400);
  }

  if (!SUPPORTED_IMPORT_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
    throw new CompetitionImportError(
      "Es werden nur Wettbewerbs-URLs von fussball.de und next.fussball.de unterstützt.",
      400,
    );
  }

  const competitionId = extractCanonicalCompetitionId(parsedUrl);

  if (!competitionId) {
    throw new CompetitionImportError(
      "Aus der Wettbewerbs-URL konnte keine Staffel-ID gelesen werden.",
      400,
    );
  }

  return {
    candidateUrls: [
      `${LEGACY_HOST}/spieltag/-/staffel/${competitionId}`,
      `${LEGACY_HOST}/spieltagsuebersicht/-/staffel/${competitionId}`,
    ],
  };
}

function normalizeSeason(value: string): string {
  if (/^\d{4}$/.test(value)) {
    return `${value.slice(0, 2)}/${value.slice(2)}`;
  }

  return value;
}

function extractScriptValue(html: string, key: string): string {
  const match = html.match(new RegExp(`${key}='([^']*)'`));
  return match?.[1] ?? "";
}

async function fetchText(url: string): Promise<string> {
  return fetchUpstreamText(url, {
    cache: "no-store",
    memoryTtlMs: COMPETITION_PAGE_CACHE_TTL_MS,
    errorBase: `Abruf von '${url}' fehlgeschlagen`,
  });
}

function parseOptionalNumber(value: string): number | null {
  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRequiredNumber(value: string, context: string): number {
  const parsed = parseOptionalNumber(value);

  if (parsed === null) {
    throw new Error(`${context} konnte nicht gelesen werden.`);
  }

  return parsed;
}

function parseRequiredRatio(value: string, context: string): { goalsFor: number; goalsAgainst: number } {
  const [goalsForRaw, goalsAgainstRaw] = value.split(":");

  if (goalsForRaw === undefined || goalsAgainstRaw === undefined) {
    throw new Error(`${context} konnte nicht gelesen werden.`);
  }

  const goalsFor = parseRequiredNumber(goalsForRaw, `${context} (Heimtore)`);
  const goalsAgainst = parseRequiredNumber(goalsAgainstRaw, `${context} (Gegentore)`);
  return { goalsFor, goalsAgainst };
}

function parseTeamId(url: string): string {
  return url.match(/team-id\/([^/?]+)/)?.[1] ?? url;
}

function parseProfile(html: string): CompetitionProfile {
  const id = extractScriptValue(html, "edWettbewerbId");
  const name = extractScriptValue(html, "edWettbewerbName");
  const season = normalizeSeason(extractScriptValue(html, "edSaison"));
  const association = extractScriptValue(html, "edVerbandName");
  const teamType = extractScriptValue(html, "edMannschaftsartName");
  const leagueLevel = extractScriptValue(html, "edSpielklasseName");
  const area = extractScriptValue(html, "edGebietName");
  const sourceCompetitionUrl = extractScriptValue(html, "edWettbewerbUrl");

  if (!id || !name) {
    throw new Error("Die Wettbewerbsdaten konnten aus der fussball.de Seite nicht gelesen werden.");
  }

  return {
    kind: extractScriptValue(html, "edWettbewerbTypId") === "308" ||
      extractScriptValue(html, "edWettkampfTypName") === "Pokale" ? "cup" : "league",
    id,
    name,
    season,
    association,
    teamType,
    leagueLevel,
    area,
    sourceCompetitionUrl,
  };
}

function parseMatchdayOptions($: CheerioAPI): MatchdayOption[] {
  return $('select[name="spieltag"] option')
    .toArray()
    .map((option) => {
      const $option = $(option);
      const label = $option.text().trim();
      const number = parseOptionalNumber(label) ?? 0;
      return {
        number,
        label,
        url: absoluteUrl($option.attr("data-href")),
        selected: $option.is("[selected]") || $option.hasClass("on"),
      };
    })
    .filter((option) => option.number > 0 && option.url);
}

function parseCupRoundOptions($: CheerioAPI): MatchdayOption[] {
  const options: MatchdayOption[] = [];
  const seen = new Set<string>();
  for (const element of $("select option[data-href]").toArray()) {
    const option = $(element);
    const text = option.text().replace(/\s+/g, " ").trim();
    if (!/^(KO-Runde|Gruppenrunde)\s*-/i.test(text)) continue;
    const url = absoluteUrl(option.attr("data-href"));
    if (seen.has(url) || new URL(url).hostname !== "www.fussball.de") continue;
    seen.add(url);
    options.push({
      number: options.length + 1,
      label: text.replace(/^(KO-Runde|Gruppenrunde)\s*-\s*/i, ""),
      url,
      selected: option.is("[selected]") || option.hasClass("on"),
      stageType: /^Gruppenrunde/i.test(text) ? "group" : "knockout",
    });
  }
  return options;
}

function parseTable($: CheerioAPI): TableRow[] {
  const rows: TableRow[] = [];

  for (const row of $("#fixture-league-tables tbody tr").toArray()) {
    const $row = $(row);
    const teamLink = $row.find("td.column-club a").first();
    const teamName = teamLink.find(".club-name").text().replace(/\s+/g, " ").trim();

    if (!teamName) {
      continue;
    }

    const cells = $row.find("td");
    const teamContext = `Tabellenzeile für '${teamName}'`;
    const rank = parseRequiredNumber($row.find("td.column-rank").text(), `${teamContext}: Platz`);
    const games = parseRequiredNumber(cells.eq(3).text(), `${teamContext}: Spiele`);
    const wins = parseRequiredNumber(cells.eq(4).text(), `${teamContext}: Siege`);
    const draws = parseRequiredNumber(cells.eq(5).text(), `${teamContext}: Unentschieden`);
    const losses = parseRequiredNumber(cells.eq(6).text(), `${teamContext}: Niederlagen`);
    const ratio = parseRequiredRatio(cells.eq(7).text(), `${teamContext}: Tore`);
    const goalDifference = parseRequiredNumber(cells.eq(8).text(), `${teamContext}: Tordifferenz`);
    const points = parseRequiredNumber(cells.eq(9).text(), `${teamContext}: Punkte`);

    rows.push({
      teamId: parseTeamId(teamLink.attr("href") ?? teamName),
      teamName,
      teamLogoUrl: parseTeamLogoUrl(teamLink),
      tableZone: parseTableZone($row),
      rank,
      originalRank: rank,
      games,
      wins,
      draws,
      losses,
      goalsFor: ratio.goalsFor,
      goalsAgainst: ratio.goalsAgainst,
      goalDifference,
      points,
    });
  }

  return rows;
}

function parseTableZone($row: Cheerio<AnyNode>): TableZone | undefined {
  if ($row.hasClass("row-promotion")) {
    return "promotion";
  }

  if ($row.hasClass("row-promotion-playoff")) {
    return "promotion-playoff";
  }

  if ($row.hasClass("row-relegation-playoff")) {
    return "relegation-playoff";
  }

  if ($row.hasClass("row-relegation")) {
    return "relegation";
  }

  return undefined;
}

async function withConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < values.length) {
      const currentIndex = index++;
      results[currentIndex] = await mapper(values[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}

async function loadLandingPage(url: string): Promise<{ html: string; sourceUrl: string }> {
  const { candidateUrls } = normalizeCompetitionImportUrl(url);

  for (const candidate of candidateUrls) {
    try {
      const html = await fetchText(candidate);

      const $ = load(html);
      if (parseMatchdayOptions($).length || parseCupRoundOptions($).length) {
        return { html, sourceUrl: candidate };
      }
    } catch {
      continue;
    }
  }

  throw new Error("Die URL konnte nicht in eine lesbare fussball.de Wettbewerbsseite aufgelöst werden.");
}

function buildTableAdjustments(importedTable: TableRow[], matchdays: Matchday[]) {
  const baselineCompetition: Competition = {
    kind: "league",
    id: "baseline",
    name: "baseline",
    season: "",
    association: "",
    teamType: "",
    leagueLevel: "",
    area: "",
    sourceUrl: "",
    sourceCompetitionUrl: "",
    currentMatchdayNumber: null,
    tableAdjustments: {},
    importedTable,
    matchdays,
  };
  const baselineRows = recalculateTableFromResults(baselineCompetition, {});
  const baselineByTeamId = new Map(baselineRows.map((row) => [row.teamId, row]));

  return Object.fromEntries(
    importedTable.map((row) => {
      const baseline = baselineByTeamId.get(row.teamId);
      const adjustment = baseline
        ? {
            games: row.games - baseline.games,
            wins: row.wins - baseline.wins,
            draws: row.draws - baseline.draws,
            losses: row.losses - baseline.losses,
            goalsFor: row.goalsFor - baseline.goalsFor,
            goalsAgainst: row.goalsAgainst - baseline.goalsAgainst,
            goalDifference: row.goalDifference - baseline.goalDifference,
            points: row.points - baseline.points,
          }
        : createEmptyTableAdjustment();

      return [row.teamId, adjustment];
    }),
  );
}

export async function loadCompetitionFromUrl(inputUrl: string): Promise<Competition> {
  const { html: landingHtml, sourceUrl } = await loadLandingPage(inputUrl.trim());
  const profile = parseProfile(landingHtml);
  const $landing = load(landingHtml);
  const isCup = profile.kind === "cup";
  const matchdayOptions = isCup ? parseCupRoundOptions($landing)
    : parseMatchdayOptions($landing).sort((left, right) => left.number - right.number);
  const selectedMatchday = matchdayOptions.find((option) => option.selected) ?? matchdayOptions[0];

  if (!selectedMatchday) {
    throw new Error("Es konnten keine Spieltage für den Wettbewerb ermittelt werden.");
  }

  const importedTable = isCup ? [] : parseTable($landing);

  if (!isCup && !importedTable.length) {
    throw new Error("Die Wettbewerbstabelle konnte nicht aus der importierten Seite gelesen werden.");
  }

  const canReuseLanding = !isCup || [profile.id, extractStaffelId(selectedMatchday.url)]
    .includes(extractStaffelId(sourceUrl));
  const matchdays = await withConcurrency(matchdayOptions, 4, async (option) => {
    const pageHtml = canReuseLanding && option.number === selectedMatchday.number ? landingHtml : await fetchText(option.url);
    const $ = load(pageHtml);

    return {
      number: option.number,
      label: option.label,
      url: option.url,
      stageType: option.stageType,
      matches: await parseMatches($, option.number),
    } satisfies Matchday;
  });
  const tableAdjustments = isCup ? {} : buildTableAdjustments(importedTable, matchdays);

  return {
    kind: profile.kind,
    id: profile.id,
    name: profile.name,
    season: profile.season,
    association: profile.association,
    teamType: profile.teamType,
    leagueLevel: profile.leagueLevel,
    area: profile.area,
    sourceUrl,
    sourceCompetitionUrl: absoluteUrl(profile.sourceCompetitionUrl || sourceUrl),
    currentMatchdayNumber: selectedMatchday.number,
    tableAdjustments,
    importedTable,
    matchdays,
  };
}
