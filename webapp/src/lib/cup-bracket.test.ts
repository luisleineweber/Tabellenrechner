import { describe, expect, it } from "vitest";
import { buildCupBracket, pruneCupEdits, type CupEdits } from "./cup-bracket";
import type { ImportedMatch, Matchday } from "./fussballde/types";

function match(id: string, home: string, guest: string, homeScore: number | null = 2, guestScore: number | null = 1): ImportedMatch {
  return { id, matchday: 1, kickoffText: "", homeTeamId: home, homeTeamName: home,
    guestTeamId: guest, guestTeamName: guest, detailUrl: "", isBye: false,
    originalResult: { home: homeScore, guest: guestScore } };
}
function round(number: number, matches: ImportedMatch[]): Matchday {
  return { number, label: `${number}. Runde`, url: "", stageType: "knockout", matches };
}
const rounds = [round(1, [match("a", "A", "B"), match("b", "C", "D")]),
  round(2, [match("final", "A", "C")])];

describe("cup bracket", () => {
  it("uses team identity to link published draws and keeps their original scores", () => {
    const bracket = buildCupBracket(rounds, {});
    expect(bracket[1].matches[0].homeSource).toBe("a");
    expect(bracket[1].matches[0].guestSource).toBe("b");
    expect(bracket[1].matches[0].winner?.id).toBe("A");
  });

  it("advances an edited winner and clears the result of the changed pairing", () => {
    const edits: CupEdits = { a: { pairing: '["A","B"]', home: "0", guest: "3" },
      final: { pairing: '["A","C"]', home: "4", guest: "0" } };
    const final = buildCupBracket(rounds, edits)[1].matches[0];
    expect(final.home?.id).toBe("B");
    expect(final.result).toEqual({ home: null, guest: null });
    expect(final.winner).toBeNull();
    expect(final.edited).toBe(false);
    expect(pruneCupEdits(rounds, edits)).toEqual({ a: edits.a });
    expect(buildCupBracket(rounds, {})[1].matches[0].result).toEqual({ home: 2, guest: 1 });
  });

  it("clears later winners across several rounds and restores the imported draw on reset", () => {
    const bracket = [...rounds, round(3, [match("next", "A", "E")])];
    const edits: CupEdits = { a: { pairing: '["A","B"]', home: "0", guest: "3" },
      final: { pairing: '["A","C"]', home: "4", guest: "0" },
      next: { pairing: '["A","E"]', home: "7", guest: "0" } };
    expect(buildCupBracket(bracket, edits)[2].matches[0].home).toBeNull();
    expect(pruneCupEdits(bracket, edits)).toEqual({ a: edits.a });
    expect(buildCupBracket(bracket, {})[2].matches[0].home?.id).toBe("A");
  });

  it("requires a winner for a tied prediction and handles a partial score", () => {
    const edits: CupEdits = { a: { pairing: '["A","B"]', home: "1", guest: "1" } };
    expect(buildCupBracket(rounds, edits)[1].matches[0].home).toBeNull();
    edits.a.winner = "guest";
    expect(buildCupBracket(rounds, edits)[1].matches[0].home?.id).toBe("B");
    edits.a.home = "";
    expect(buildCupBracket(rounds, edits)[0].matches[0].winner).toBeNull();
  });

  it("handles home and guest byes without editable scores", () => {
    const bye = { ...match("bye", "spielfrei", "C", null, null), isBye: true };
    expect(buildCupBracket([round(1, [bye])], {})[0].matches[0].winner?.id).toBe("C");
  });

  it("keeps unknown draws empty and does not infer paths by row order", () => {
    const final = { ...match("final", "open", "C", null, null), homeTeamIsPlaceholder: true };
    const bracket = buildCupBracket([rounds[0], round(2, [final]), round(3, [])], {});
    expect(bracket[1].matches[0].home).toBeNull();
    expect(bracket[1].matches[0].homeSource).toBeUndefined();
    expect(bracket[2].matches).toEqual([]);
  });

  it("does not advance group-stage winners or a loser into a third-place match", () => {
    const group = { ...rounds[0], stageType: "group" as const };
    expect(buildCupBracket([group, rounds[1]], {})[1].matches[0].homeSource).toBeUndefined();
    const thirdPlace = round(2, [match("third", "B", "D")]);
    expect(buildCupBracket([rounds[0], thirdPlace], {})[1].matches[0].homeSource).toBeUndefined();
  });
});
