"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Competition } from "@/lib/fussballde/types";
import { buildCupBracket, pruneCupEdits, type CupEdit, type CupEdits, type CupMatch, type CupRound, type CupSide } from "@/lib/cup-bracket";
import styles from "./cup-bracket.module.css";

function scrollToRound(scroller: HTMLDivElement | null, number: number) {
  const section = scroller?.querySelector<HTMLElement>(`#cup-round-${number}`);
  if (!scroller || !section) return;
  const bounds = scroller.getBoundingClientRect();
  const first = section.querySelector<HTMLElement>("article") ?? section.lastElementChild?.firstElementChild;
  const headerHeight = section.firstElementChild?.getBoundingClientRect().height ?? 0;
  scroller.scrollTo({
    left: section.getBoundingClientRect().left - bounds.left + scroller.scrollLeft - 12,
    top: first ? first.getBoundingClientRect().top - bounds.top + scroller.scrollTop - headerHeight - 16 : 0,
  });
}

function BracketConnections({ rounds }: { rounds: CupRound[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lines, setLines] = useState<Array<{ id: string; path: string }>>([]);
  useEffect(() => {
    const track = svgRef.current?.parentElement;
    if (!track) return;
    function measure() {
      if (!track) return;
      const bounds = track.getBoundingClientRect();
      const nextLines: Array<{ id: string; path: string }> = [];
      for (const round of rounds) {
        for (const match of round.matches) {
          const target = track.querySelector(`[data-cup-match="${CSS.escape(match.original.id)}"]`);
          if (!target) continue;
          const to = target.getBoundingClientRect();
          for (const sourceId of [match.homeSource, match.guestSource]) {
            if (!sourceId) continue;
            const source = track.querySelector(`[data-cup-match="${CSS.escape(sourceId)}"]`);
            if (!source) continue;
            const from = source.getBoundingClientRect();
            const x1 = from.right - bounds.left;
            const x2 = to.left - bounds.left;
            const y1 = from.top + from.height / 2 - bounds.top;
            const y2 = to.top + to.height / 2 - bounds.top;
            const middle = (x1 + x2) / 2;
            nextLines.push({ id: `${sourceId}-${match.original.id}`, path: `M${x1},${y1} C${middle},${y1} ${middle},${y2} ${x2},${y2}` });
          }
        }
      }
      setLines(nextLines);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    track.querySelectorAll("[data-cup-match]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [rounds]);
  return <svg ref={svgRef} className={styles.connections} aria-hidden="true">
    {lines.map((line) => <path key={line.id} d={line.path} />)}
  </svg>;
}

function MatchCard({ match, number, numbers, edit, onEdit, onReset, group }: {
  match: CupMatch; number: number; numbers: Map<string, number>; edit?: CupEdit;
  onEdit: (match: CupMatch, patch: Partial<CupEdit>) => void;
  onReset: (id: string) => void; group: boolean;
}) {
  const original = match.original;
  const canEdit = Boolean(match.home && match.guest && !original.isBye);
  const isTie = canEdit && match.result.home !== null && match.result.home === match.result.guest;
  return <article id={`cup-match-${original.id}`} data-cup-match={original.id} className={styles.match} tabIndex={-1}
    aria-label={`Spiel ${number}: ${match.home?.name ?? original.homeTeamName} gegen ${match.guest?.name ?? original.guestTeamName}`}>
    <div className={styles.matchMeta}>
      <span>Spiel {number}</span>
      {original.detailUrl ? <a href={original.detailUrl} target="_blank" rel="noreferrer" aria-label={`Spiel ${number} bei fussball.de öffnen`}>fussball.de ↗</a> : null}
    </div>
    {(["home", "guest"] as const).map((side: CupSide) => {
      const team = match[side];
      const sourceId = match[`${side}Source`];
      const winner = team && team.id === match.winner?.id;
      const value = edit?.[side] ?? String(match.result[side] ?? "");
      return <div key={side} className={`${styles.teamRow} ${winner ? styles.winner : ""}`}>
        <div className={styles.team}>
          {team?.logoUrl ? <Image src={team.logoUrl} alt="" width={22} height={22} unoptimized /> : <span className={styles.crest} aria-hidden="true">◇</span>}
          <div className={styles.teamText}>
            <span>{team?.name ?? (sourceId ? "Sieger noch offen" : original[`${side}TeamName`])}</span>
            {sourceId ? <a href={`#cup-match-${sourceId}`}>Aus Spiel {numbers.get(sourceId)}</a> : null}
          </div>
          {winner ? <span className={styles.winnerMark} aria-label={group ? "Sieger" : "Weiter"}>✓</span> : null}
        </div>
        {original.isBye ? <span className={styles.byeScore}>–</span> : <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
          aria-label={`${side === "home" ? "Heimtore" : "Gasttore"} Spiel ${number}: ${team?.name ?? original[`${side}TeamName`]}`}
          value={value} disabled={!canEdit}
          onChange={(event) => onEdit(match, { [side]: event.target.value.replace(/\D/g, "").slice(0, 2), winner: undefined })}
        />}
      </div>;
    })}
    <div className={styles.matchFooter}>
      <span>{original.isBye ? "Freilos" : match.participantsChanged ? "Neue Paarung · Ergebnis offen"
        : original.kickoffText || "Termin noch offen"}</span>
      {match.edited ? <button type="button" onClick={() => onReset(original.id)} aria-label={`Spiel ${number} zurücksetzen`}>Zurücksetzen</button> : null}
    </div>
    {!match.edited && !match.participantsChanged && original.resultNote ? <p className={styles.note}>{original.resultNote}</p> : null}
    {isTie && !group ? <label className={styles.tie}>
      <span>Wer kommt weiter?</span>
      <select value={edit?.winner ?? ""} onChange={(event) => onEdit(match, { winner: event.target.value as CupSide || undefined })}>
        <option value="">Sieger wählen</option>
        <option value="home">{match.home?.name}</option>
        <option value="guest">{match.guest?.name}</option>
      </select>
    </label> : null}
  </article>;
}

export function CupBracket({ competition }: { competition: Competition }) {
  const [edits, setEdits] = useState<CupEdits>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToRound(scrollRef.current, competition.currentMatchdayNumber ?? competition.matchdays[0]?.number));
    return () => cancelAnimationFrame(frame);
  }, [competition]);
  const rounds = buildCupBracket(competition.matchdays, edits);
  const numbers = new Map<string, number>();
  for (const round of rounds) for (const match of round.matches) numbers.set(match.original.id, numbers.size + 1);
  const activeEdits = rounds.flatMap((round) => round.matches).filter((match) => match.edited).length;
  const last = rounds.at(-1);
  const isFinal = Boolean(last?.stageType !== "group" && last && /\b(finale|endspiel)\b/i.test(last.label));
  const champion = isFinal && last?.matches.length === 1 ? last.matches[0].winner : null;

  function update(match: CupMatch, patch: Partial<CupEdit>) {
    setEdits((current) => {
      const existing = current[match.original.id];
      const base = existing?.pairing === match.pairing ? existing : {
        pairing: match.pairing, home: String(match.result.home ?? ""), guest: String(match.result.guest ?? ""),
      };
      const next = { ...current, [match.original.id]: { ...base, ...patch } };
      const value = next[match.original.id];
      if (!match.participantsChanged && value.home === String(match.original.originalResult.home ?? "") &&
        value.guest === String(match.original.originalResult.guest ?? "") && !value.winner) {
        delete next[match.original.id];
      }
      // Drop predictions whose participants changed after this edit.
      return pruneCupEdits(competition.matchdays, next);
    });
  }

  function reset(id: string) {
    setEdits((current) => {
      const next = { ...current };
      delete next[id];
      return pruneCupEdits(competition.matchdays, next);
    });
  }

  return <section className={styles.panel} aria-labelledby="cup-title">
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Pokalrechner</p><h2 id="cup-title">Turnierbaum</h2></div>
      <button type="button" onClick={() => setEdits({})} disabled={!Object.keys(edits).length}>Alle Tipps zurücksetzen</button>
      <p>Ergebnisse ändern und bekannte Paarungen durchrechnen. Noch offene Auslosungen bleiben offen.</p>
    </header>
    <div className={styles.status} role="status">
      {champion ? <span><strong>Pokalsieger: {champion.name}</strong>{activeEdits ? " · Dein Tipp" : ""}</span>
        : <span>{activeEdits ? `${activeEdits} ${activeEdits === 1 ? "Spiel" : "Spiele"} geändert` : "Originalergebnisse von fussball.de"}</span>}
    </div>
    <nav className={styles.navigation} aria-label="Pokalrunden">
      {rounds.map((round) => <button key={round.number} type="button" onClick={() => scrollToRound(scrollRef.current, round.number)}>{round.label}</button>)}
      {!isFinal ? <button type="button" onClick={() => scrollToRound(scrollRef.current, rounds.length + 1)}>Weitere Runden</button> : null}
    </nav>
    <p id="cup-scroll-hint" className={styles.scrollHint}>Runden nebeneinander · Nach rechts scrollen für spätere Runden</p>
    <div ref={scrollRef} className={styles.scroller} tabIndex={0} role="region" aria-label="Turnierbaum" aria-describedby="cup-scroll-hint">
      <div className={styles.track}>
        <BracketConnections rounds={rounds} />
        {rounds.map((round) => <section key={round.number} id={`cup-round-${round.number}`} className={styles.round} aria-labelledby={`cup-round-title-${round.number}`}>
          <div className={styles.roundHeader}><h3 id={`cup-round-title-${round.number}`}>{round.label}</h3><span>{round.stageType === "group" ? "Gruppenrunde · " : ""}{round.matches.length} Spiele</span></div>
          <div className={`${styles.matches} ${!round.matches.length ? styles.emptyMatches : ""}`}>
            {round.matches.map((match) => <MatchCard key={match.original.id} match={match} number={numbers.get(match.original.id)!} numbers={numbers}
              edit={edits[match.original.id]?.pairing === match.pairing ? edits[match.original.id] : undefined}
              onEdit={update} onReset={reset} group={round.stageType === "group"} />)}
            {!round.matches.length ? <div className={styles.openRound}><strong>Paarungen noch offen</strong><p>Für diese Runde sind noch keine Spiele veröffentlicht.</p></div> : null}
          </div>
        </section>)}
        {!isFinal ? <section id={`cup-round-${rounds.length + 1}`} className={styles.round}><div className={styles.roundHeader}><h3>Weitere Runden</h3><span>Auslosung offen</span></div><div className={`${styles.matches} ${styles.emptyMatches}`}><div className={styles.openRound}><strong>Hier geht es später weiter</strong><p>Lade den Pokal nach der nächsten Auslosung erneut.</p></div></div></section> : null}
      </div>
    </div>
  </section>;
}
