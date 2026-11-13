import type { EditableResultMap } from "@/lib/fussballde/types";
import { normalizeInputToNullableNumber } from "./table-calculator";

type ScoreEdit = EditableResultMap[string];
type ImportedResult = { home: number | null; guest: number | null };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Applies a +/- step to one side of a score. Without an edit, the imported
 * result is the start value. With an edit, its values count as entered, so a
 * cleared field stays empty: it counts as 0 only on the stepped side, and the
 * other side keeps its current value.
 */
export function stepScore(
  edit: ScoreEdit | undefined,
  original: ImportedResult,
  side: "home" | "guest",
  delta: number,
): ScoreEdit {
  const current: ScoreEdit = edit ?? {
    home: original.home !== null ? String(original.home) : "",
    guest: original.guest !== null ? String(original.guest) : "",
  };
  const base = normalizeInputToNullableNumber(current[side]) ?? 0;
  return { ...current, [side]: String(clamp(base + delta, 0, 99)) };
}
