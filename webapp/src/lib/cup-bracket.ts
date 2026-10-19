import type { ImportedMatch, Matchday, MatchResult } from "./fussballde/types";

export type CupTeam = { id: string; name: string; logoUrl?: string };
export type CupSide = "home" | "guest";
export type CupEdit = { pairing: string; home: string; guest: string; winner?: CupSide };
export type CupEdits = Record<string, CupEdit>;
export type CupMatch = {
  original: ImportedMatch;
  home: CupTeam | null;
  guest: CupTeam | null;
  homeSource?: string;
  guestSource?: string;
  pairing: string;
  result: MatchResult;
  winner: CupTeam | null;
  edited: boolean;
  participantsChanged: boolean;
};
export type CupRound = Omit<Matchday, "matches"> & { matches: CupMatch[] };

function originalTeam(match: ImportedMatch, side: CupSide): CupTeam | null {
  if (match[`${side}TeamIsPlaceholder`] || /^spielfrei$/i.test(match[`${side}TeamName`])) return null;
  return { id: match[`${side}TeamId`], name: match[`${side}TeamName`], logoUrl: match[`${side}TeamLogoUrl`] };
}

function originalWinner(match: ImportedMatch): CupTeam | null {
  const home = originalTeam(match, "home");
  const guest = originalTeam(match, "guest");
  if (match.isBye) return home ?? guest;
  const result = match.originalResult;
  if (result.home === null || result.guest === null || result.home === result.guest) return null;
  return result.home > result.guest ? home : guest;
}

function sourceMatch(previous: Matchday | undefined, team: CupTeam | null): ImportedMatch | undefined {
  if (!previous || previous.stageType === "group" || !team) return undefined;
  const candidates = previous.matches.filter((match) => {
    const winner = originalWinner(match);
    return winner ? winner.id === team.id
      : [originalTeam(match, "home")?.id, originalTeam(match, "guest")?.id].includes(team.id);
  });
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function cupPairing(home: CupTeam | null, guest: CupTeam | null): string {
  return JSON.stringify([home?.id ?? null, guest?.id ?? null]);
}

export function cupScore(value: string): number | null {
  return /^\d{1,2}$/.test(value) ? Number(value) : null;
}

export function buildCupBracket(rounds: Matchday[], edits: CupEdits): CupRound[] {
  const resolved = new Map<string, CupMatch>();
  return rounds.map((round, index) => {
    // A published group stage does not define knockout advancement paths.
    const previous = round.stageType === "group" ? undefined : rounds[index - 1];
    const sources = new Map<string, string>();
    const uses = new Map<string, number>();
    for (const match of round.matches) {
      for (const side of ["home", "guest"] as const) {
        const source = sourceMatch(previous, originalTeam(match, side));
        if (!source) continue;
        sources.set(`${match.id}:${side}`, source.id);
        uses.set(source.id, (uses.get(source.id) ?? 0) + 1);
      }
    }
    const matches = round.matches.map((original): CupMatch => {
      const sourceFor = (side: CupSide) => {
        const id = sources.get(`${original.id}:${side}`);
        return id && uses.get(id) === 1 ? id : undefined;
      };
      const homeSource = sourceFor("home");
      const guestSource = sourceFor("guest");
      const teamFor = (side: CupSide, sourceId?: string) => {
        const source = sourceId ? resolved.get(sourceId) : undefined;
        // Keep the published draw when an untouched source has no recorded result.
        if (!source || (!source.edited && !source.participantsChanged && !source.winner)) {
          return originalTeam(original, side);
        }
        return source.winner;
      };
      const home = teamFor("home", homeSource);
      const guest = teamFor("guest", guestSource);
      const pairing = cupPairing(home, guest);
      const participantsChanged = pairing !== cupPairing(originalTeam(original, "home"), originalTeam(original, "guest"));
      const stored = edits[original.id];
      const edit = stored?.pairing === pairing ? stored : undefined;
      const result = edit ? { home: cupScore(edit.home), guest: cupScore(edit.guest) }
        : participantsChanged ? { home: null, guest: null } : original.originalResult;
      let winner: CupTeam | null = null;
      if (original.isBye) winner = home ?? guest;
      else if (home && guest && result.home !== null && result.guest !== null) {
        winner = result.home > result.guest ? home : result.guest > result.home ? guest
          : edit?.winner === "home" ? home : edit?.winner === "guest" ? guest : null;
      }
      const match = { original, home, guest, homeSource, guestSource, pairing, result, winner,
        edited: Boolean(edit), participantsChanged };
      resolved.set(original.id, match);
      return match;
    });
    return { ...round, matches };
  });
}

export function pruneCupEdits(rounds: Matchday[], edits: CupEdits): CupEdits {
  const matches = buildCupBracket(rounds, edits).flatMap((round) => round.matches);
  const valid = new Map(matches.map((match) => [match.original.id, match.pairing]));
  return Object.fromEntries(Object.entries(edits).filter(([id, edit]) => valid.get(id) === edit.pairing));
}
