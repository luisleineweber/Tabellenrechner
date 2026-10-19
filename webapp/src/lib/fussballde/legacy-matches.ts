import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { decodeObfuscatedText } from "@/lib/fussballde/font-decoder";
import type { ImportedMatch } from "./types";

export function absoluteUrl(value?: string | null): string {
  if (!value) return "";
  return new URL(value, "https://www.fussball.de").href;
}

export function parseTeamLogoUrl(node: Cheerio<AnyNode>): string | undefined {
  const value = node.find(".club-logo img").first().attr("src") ??
    node.find(".club-logo [data-responsive-image]").first().attr("data-responsive-image");
  return absoluteUrl(value) || undefined;
}

async function decodeNodeText(node: Cheerio<AnyNode>): Promise<string> {
  const fontId = node.find("[data-obfuscation]").first().attr("data-obfuscation");
  const decoded = await decodeObfuscatedText(node.text().replace(/\u00a0/g, " "), fontId);
  return decoded.replace(/\s+/g, " ").trim();
}

function parseTeam(cell: Cheerio<AnyNode>, fallbackId: string) {
  const link = cell.find("a").first();
  const name = (cell.find(".club-name").text() || cell.find(".info-text").text())
    .replace(/\s+/g, " ").trim();
  const teamId = link.attr("href")?.match(/team-id\/([^/?#]+)/)?.[1];
  return {
    id: teamId ?? fallbackId,
    name,
    logoUrl: parseTeamLogoUrl(cell),
    isPlaceholder: !teamId,
  };
}

async function parseMatchRow($: CheerioAPI, row: AnyNode, matchday: number, index: number) {
  const $row = $(row);
  const cells = $row.find("td.column-club");
  const home = parseTeam(cells.first(), `open-${matchday}-${index}-home`);
  const guest = parseTeam(cells.eq(1), `open-${matchday}-${index}-guest`);
  if (!home.name && !guest.name) return null;

  const scoreCell = $row.find("td.column-score").first();
  const detailUrl = absoluteUrl(scoreCell.find("a").first().attr("href"));
  const matchId = [...detailUrl.matchAll(/\/spiel\/([^/?#]+)/g)].at(-1)?.[1];
  const decodedScore = await decodeNodeText(scoreCell);
  const score = decodedScore.match(/^(\d+)\s*:\s*(\d+)(?=\s|$|[a-zA-Z])/);
  const isBye = [home.name, guest.name].some((name) => /^spielfrei$/i.test(name));

  return {
    id: matchId ?? `${matchday}-${index}-${home.id}-${guest.id}`,
    matchday,
    kickoffText: await decodeNodeText($row.find("td.column-date").first()),
    homeTeamId: home.id,
    homeTeamName: home.name || "Noch offen",
    homeTeamLogoUrl: home.logoUrl,
    homeTeamIsPlaceholder: home.isPlaceholder,
    guestTeamId: guest.id,
    guestTeamName: guest.name || "Noch offen",
    guestTeamLogoUrl: guest.logoUrl,
    guestTeamIsPlaceholder: guest.isPlaceholder,
    detailUrl,
    originalResult: score && !isBye
      ? { home: Number(score[1]), guest: Number(score[2]) }
      : { home: null, guest: null },
    resultNote: scoreCell.find(".info-text").text().trim() || undefined,
    isBye,
  } satisfies ImportedMatch;
}

export async function parseMatches($: CheerioAPI, matchday: number): Promise<ImportedMatch[]> {
  const rows = $("table.table.table-striped.table-full-width.thead tbody tr")
    .toArray().filter((row) => $(row).find("td.column-club").length > 0);
  const candidates = await Promise.all(rows.map((row, index) => parseMatchRow($, row, matchday, index)));
  const matches: ImportedMatch[] = [];
  const seen = new Map<string, number>();
  for (const match of candidates) {
    if (!match) continue;
    const count = (seen.get(match.id) ?? 0) + 1;
    seen.set(match.id, count);
    matches.push(count === 1 ? match : { ...match, id: `${match.id}__dup${count}` });
  }
  return matches;
}
