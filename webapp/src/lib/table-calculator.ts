import type {
  Competition,
  EditableResultMap,
  ImportedMatch,
  MatchResult,
  TableAdjustment,
  TableRow,
  TableZone,
} from "@/lib/fussballde/types";

export function createEmptyTableAdjustment(): TableAdjustment {
  return {
    games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

export function hasTableAdjustments(competition: Competition): boolean {
  return Object.values(competition.tableAdjustments).some((adjustment) =>
    Object.values(adjustment).some((value) => value !== 0),
  );
}

function toTableSeed(competition: Competition): Map<string, TableRow> {
  const seed = new Map<string, TableRow>();

  for (const row of competition.importedTable) {
    const adjustment = competition.tableAdjustments[row.teamId] ?? createEmptyTableAdjustment();
    seed.set(row.teamId, {
      ...row,
      rank: row.originalRank,
      games: adjustment.games,
      wins: adjustment.wins,
      draws: adjustment.draws,
      losses: adjustment.losses,
      goalsFor: adjustment.goalsFor,
      goalsAgainst: adjustment.goalsAgainst,
      goalDifference: adjustment.goalDifference,
      points: adjustment.points,
    });
  }

  for (const matchday of competition.matchdays) {
    for (const match of matchday.matches) {
      if (!seed.has(match.homeTeamId)) {
        const adjustment = competition.tableAdjustments[match.homeTeamId] ?? createEmptyTableAdjustment();
        seed.set(match.homeTeamId, {
          teamId: match.homeTeamId,
          teamName: match.homeTeamName,
          rank: 0,
          originalRank: 0,
          games: adjustment.games,
          wins: adjustment.wins,
          draws: adjustment.draws,
          losses: adjustment.losses,
          goalsFor: adjustment.goalsFor,
          goalsAgainst: adjustment.goalsAgainst,
          goalDifference: adjustment.goalDifference,
          points: adjustment.points,
        });
      }

      if (!match.isBye && !seed.has(match.guestTeamId)) {
        const adjustment = competition.tableAdjustments[match.guestTeamId] ?? createEmptyTableAdjustment();
        seed.set(match.guestTeamId, {
          teamId: match.guestTeamId,
          teamName: match.guestTeamName,
          rank: 0,
          originalRank: 0,
          games: adjustment.games,
          wins: adjustment.wins,
          draws: adjustment.draws,
          losses: adjustment.losses,
          goalsFor: adjustment.goalsFor,
          goalsAgainst: adjustment.goalsAgainst,
          goalDifference: adjustment.goalDifference,
          points: adjustment.points,
        });
      }
    }
  }

  return seed;
}

export function normalizeInputToNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeEditResult(
  match: ImportedMatch,
  edit: EditableResultMap[string],
): { result: MatchResult; pending: boolean } {
  const home = normalizeInputToNullableNumber(edit.home);
  const guest = normalizeInputToNullableNumber(edit.guest);
  const pending = (home === null) !== (guest === null);

  if (pending) {
    return {
      result: match.originalResult,
      pending: true,
    };
  }

  return {
    result: {
      home,
      guest,
    },
    pending: false,
  };
}

function resultsEqual(left: MatchResult, right: MatchResult): boolean {
  return left.home === right.home && left.guest === right.guest;
}

export function getEffectiveResult(match: ImportedMatch, edits: EditableResultMap): MatchResult {
  const edit = edits[match.id];

  if (!edit) {
    return match.originalResult;
  }

  return normalizeEditResult(match, edit).result;
}

export function hasPendingEdit(match: ImportedMatch, edits: EditableResultMap): boolean {
  const edit = edits[match.id];

  if (!edit) {
    return false;
  }

  return normalizeEditResult(match, edit).pending;
}

export function hasCommittedEdit(match: ImportedMatch, edits: EditableResultMap): boolean {
  const edit = edits[match.id];

  if (!edit) {
    return false;
  }

  const { pending, result } = normalizeEditResult(match, edit);

  return !pending && !resultsEqual(result, match.originalResult);
}

export function countActiveEdits(edits: EditableResultMap): number {
  return Object.keys(edits).length;
}

export function countCommittedEdits(competition: Competition, edits: EditableResultMap): number {
  const countedMatchIds = new Set<string>();
  let count = 0;

  for (const matchday of competition.matchdays) {
    for (const match of matchday.matches) {
      if (countedMatchIds.has(match.id)) {
        continue;
      }

      countedMatchIds.add(match.id);

      if (hasCommittedEdit(match, edits)) {
        count += 1;
      }
    }
  }

  return count;
}

export function countPendingEdits(competition: Competition, edits: EditableResultMap): number {
  const countedMatchIds = new Set<string>();
  let count = 0;

  for (const matchday of competition.matchdays) {
    for (const match of matchday.matches) {
      if (countedMatchIds.has(match.id)) {
        continue;
      }

      countedMatchIds.add(match.id);

      if (hasPendingEdit(match, edits)) {
        count += 1;
      }
    }
  }

  return count;
}

export function recalculateTableFromResults(
  competition: Competition,
  edits: EditableResultMap,
): TableRow[] {
  const table = toTableSeed(competition);
  const countedMatchIds = new Set<string>();

  for (const matchday of competition.matchdays) {
    for (const match of matchday.matches) {
      if (match.isBye) {
        continue;
      }

      if (countedMatchIds.has(match.id)) {
        continue;
      }

      countedMatchIds.add(match.id);

      const result = getEffectiveResult(match, edits);

      if (result.home === null || result.guest === null) {
        continue;
      }

      const home = table.get(match.homeTeamId);
      const guest = table.get(match.guestTeamId);

      if (!home || !guest) {
        continue;
      }

      home.games += 1;
      guest.games += 1;
      home.goalsFor += result.home;
      home.goalsAgainst += result.guest;
      home.goalDifference += result.home - result.guest;
      guest.goalsFor += result.guest;
      guest.goalsAgainst += result.home;
      guest.goalDifference += result.guest - result.home;

      if (result.home > result.guest) {
        home.wins += 1;
        home.points += 3;
        guest.losses += 1;
      } else if (result.home < result.guest) {
        guest.wins += 1;
        guest.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        guest.draws += 1;
        home.points += 1;
        guest.points += 1;
      }
    }
  }

  const rows = Array.from(table.values());

  rows.sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if ((left.games === 0) !== (right.games === 0)) {
      return left.games === 0 ? 1 : -1;
    }

    if (right.goalDifference !== left.goalDifference) {
      return right.goalDifference - left.goalDifference;
    }

    if (right.goalsFor !== left.goalsFor) {
      return right.goalsFor - left.goalsFor;
    }

    if (left.originalRank > 0 && right.originalRank > 0 && left.originalRank !== right.originalRank) {
      return left.originalRank - right.originalRank;
    }

    return left.teamName.localeCompare(right.teamName, "de");
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export function recalculateTable(competition: Competition, edits: EditableResultMap): TableRow[] {
  if (countActiveEdits(edits) === 0) {
    return competition.importedTable
      .map((row) => ({ ...row }))
      .sort((left, right) => left.rank - right.rank || left.originalRank - right.originalRank);
  }

  return recalculateTableFromResults(competition, edits);
}

export function getTableDelta(row: TableRow, importedTable: TableRow[]) {
  const imported = importedTable.find((candidate) => candidate.teamId === row.teamId);
  const importedRank = imported?.rank ?? row.originalRank;
  const importedPoints = imported?.points ?? 0;

  return {
    positionDelta: importedRank - row.rank,
    pointsDelta: row.points - importedPoints,
  };
}

export function getTableZoneForRank(row: TableRow, importedTable: TableRow[]): TableZone | undefined {
  return importedTable[row.rank - 1]?.tableZone;
}
