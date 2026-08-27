// scripts/full-engine-evaluation.mjs
//
// Full evaluation harness. Runs every case in evaluation-fixtures.mjs
// through the REAL production engine — no engine code is modified,
// duplicated, or reimplemented for decision-making. Every PASS/FAIL
// verdict comes from the actual exported functions:
//
//   computeForces / computeEdge   (src/ai/emotionAI.js)
//   updateEmotionField            (src/engine/emotionField.js)
//   getDominantEmotion            (src/engine/dominance.js, re-exported
//                                  from emotionField.js)
//   clampEmotion                  (src/engine/clampEmotion.js)
//
// ============================================================
// WHY THIS DOESN'T CALL classify()/interpretEmotion()
// ============================================================
// evaluation-fixtures.mjs supplies precomputed {label, score} arrays
// (synthetic GoEmotions-shaped output) instead of raw text, exactly
// like this project's own scripts/run-regression.mjs and
// scripts/replay-real-log.mjs already do (see those files' header
// comments — this is the established convention in this codebase for
// offline evaluation, since the real transformer model needs network
// access this sandbox doesn't have). This harness goes straight from
// {label, score}[] -> computeForces/computeEdge, bypassing
// interpretEmotion() entirely. Two consequences worth knowing before
// reading results:
//
//   1. interpretEmotion()'s text-based short-circuits (GREETINGS,
//      SILENT_WORDS, the empty-string check) and detectTargetedAttack()
//      never run — none of them are exported, and none of
//      evaluation-fixtures.mjs's cases depend on them (verified against
//      the fixture text by hand). If future fixtures rely on those
//      paths, this harness will not exercise them correctly.
//   2. `confidence` is computed here as `Math.max(...scores.map(s =>
//      s.score))` — the exact formula interpretEmotion() itself uses —
//      so it's a faithful reconstruction, not a guess.
//
// ============================================================
// CONFIDENCE AND clampEmotion()
// ============================================================
// scripts/run-regression.mjs (this project's existing regression
// script) calls `clampEmotion(current, dominant, 1.0)` — a hardcoded
// confidence of 1.0 — for every fixture, explicitly bypassing
// MIN_CONFIDENCE_TO_CHANGE so the regression suite tests dominance/
// composite math in isolation rather than also gating on synthetic
// confidence values that were never tuned to mean anything under
// MIN_CONFIDENCE_TO_CHANGE=0.7. This harness follows that same
// established convention by default (see USE_REAL_CONFIDENCE below).
// The REAL per-turn confidence is always computed and reported anyway
// (LINGUISTIC CUES section, and every JSON turn record), so nothing is
// hidden — pass --use-real-confidence to make the real value drive the
// clamp gate instead of 1.0, if you want to evaluate that gate too.
//
// ============================================================
// SECTIONS THE ENGINE DOESN'T ACTUALLY HAVE
// ============================================================
// The requested report format includes fields this engine's real
// architecture has no equivalent for. Rather than invent numbers that
// would look like real engine output but aren't, those fields are
// printed as explicit "N/A — <reason>" so nobody mistakes them for
// real signals:
//   - Composites don't consume a separate "transformer score" and
//     "cue score" that get "combined" — computeComposites() takes the
//     normalized {happy,sad,angry} shares (already-merged transformer
//     output) plus `edge`, and there's no linguistic-rule subsystem
//     independent of FORCE_MAP. LINGUISTIC CUES below reports which
//     FORCE_MAP labels cleared the (private, mirrored-for-display-only)
//     noise floor and what they contributed — that's the real, closest
//     analogue.
//   - There is no "bypass" mechanism anywhere in composite.js.
//
// ============================================================
// DIAGNOSTIC MIRRORS (candidate lists, margins, clamp reasons)
// ============================================================
// getDominantEmotion() and clampEmotion() are pure functions that
// return only a final label — they don't expose *why* (candidate
// list, margins, which branch fired). To print that detail, this file
// contains two small DISPLAY-ONLY mirrors (computeDominanceDiagnostics,
// computeClampDiagnostics) built from the same EMOTION_CONFIG constants
// the real functions read, following the exact branch logic visible in
// dominance.js / clampEmotion.js. These mirrors NEVER decide PASS/FAIL
// — the real imported functions do that — and every single turn
// cross-checks the mirror's answer against the real function's answer.
// Any disagreement is a bug in this harness (not the engine) and is
// surfaced loudly (console warning + counted in the report) rather than
// silently trusted.
//
// Usage:
//   node --experimental-loader ./scripts/resolve-ext.mjs scripts/full-engine-evaluation.mjs [flags]
//
// Flags:
//   --quiet                Suppress the full per-turn trace; print only
//                           the final aggregate report.
//   --use-real-confidence  Drive clampEmotion()'s confidence gate with
//                           the real computed per-turn confidence
//                           instead of the run-regression.mjs-style 1.0.
//   --category=<name>      Only run cases whose `category` matches
//                           exactly (case-sensitive), e.g.
//                           --category=Anxious

import { computeForces, computeEdge, FORCE_MAP } from "../src/ai/emotionAI.js";
import { updateEmotionField, getDominantEmotion } from "../src/engine/emotionField.js";
import { clampEmotion } from "../src/engine/clampEmotion.js";
import { normalizeBase } from "../src/engine/composite.js";
import { EMOTION_CONFIG } from "../src/config/emotionConfig.js";
import { TEST_CASES } from "./evaluation-fixtures.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, "../reports");

/* =====================================================
   CLI FLAGS
===================================================== */
const args = process.argv.slice(2);
const QUIET = args.includes("--quiet");
const USE_REAL_CONFIDENCE = args.includes("--use-real-confidence");
const CATEGORY_FILTER = (args.find((a) => a.startsWith("--category=")) || "").split("=")[1] || null;

/* =====================================================
   DISPLAY-ONLY MIRRORS OF PRIVATE ENGINE CONSTANTS
   (never used to make a PASS/FAIL decision — see header)
===================================================== */
const NOISE_FLOOR_DISPLAY = 0.05; // mirrors emotionAI.js's private FORCE_NOISE_FLOOR
const BASE_EMOTIONS_DISPLAY = ["happy", "sad", "angry", "silent"]; // mirrors clampEmotion.js's private BASE_EMOTIONS
const BASE_KEYS = ["happy", "sad", "angry"];
const COMPOSITE_KEYS = [
  "bittersweet",
  "disgust",
  "anxious",
  "frustrated",
  "sarcastic",
  "conflicted",
  "overwhelmed",
];

/* =====================================================
   FORMATTING HELPERS
===================================================== */
const DIV = "-".repeat(40);
const SEP = "=".repeat(49);

function fmt(n, d = 3) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : String(n);
}

function section(title, bodyLines) {
  return [DIV, title, DIV, ...bodyLines].join("\n");
}

function log(...lines) {
  if (!QUIET) console.log(...lines);
}

/* =====================================================
   DIAGNOSTIC HELPERS (read-only introspection, see header)
===================================================== */

/** Which FORCE_MAP labels cleared the noise floor, and what they pushed. */
function computeMatchedRules(scores) {
  return scores
    .filter((s) => s.score >= NOISE_FLOOR_DISPLAY && FORCE_MAP[s.label])
    .map((s) => {
      const w = FORCE_MAP[s.label];
      const parts = [];
      if (w.happy) parts.push(`happy+=${fmt(s.score * w.happy)}`);
      if (w.sad) parts.push(`sad+=${fmt(s.score * w.sad)}`);
      if (w.angry) parts.push(`angry+=${fmt(s.score * w.angry)}`);
      return {
        label: s.label,
        score: s.score,
        weights: w,
        contribution: parts.length ? parts.join(", ") : "(no valence weight)",
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Per-composite gate/threshold diagnostics, using the REAL exported COMPOSITE_THRESHOLD config. */
function computeCompositeDiagnostics(base, edge, finalField) {
  const n = normalizeBase(base);
  const out = {};
  for (const key of COMPOSITE_KEYS) {
    const gate = EMOTION_CONFIG.COMPOSITE_THRESHOLD[key];
    const gatePassed = !gate || Object.entries(gate).every(([emo, min]) => (n[emo] ?? 0) >= min);
    out[key] = {
      normalizedShares: n,
      edge,
      threshold: gate ?? null,
      gatePassed,
      finalScore: finalField[key] ?? 0,
    };
  }
  return out;
}

/** DISPLAY-ONLY mirror of dominance.js's candidate-selection algorithm. */
function computeDominanceDiagnostics(field, current) {
  const { happy = 0, sad = 0, angry = 0 } = field;
  const baseEnergy = happy + sad + angry;

  if (baseEnergy < 0.15) {
    return {
      candidates: {},
      sorted: [],
      winner: "silent",
      reason: `total base energy ${fmt(baseEnergy)} < 0.15 rest-state floor`,
      margin: null,
      hysteresis: null,
    };
  }

  const normalizedBase = normalizeBase({ happy, sad, angry });
  const topBaseValue = Math.max(normalizedBase.happy, normalizedBase.sad, normalizedBase.angry);

  const candidates = { ...normalizedBase };
  for (const [key, value] of Object.entries(field)) {
    if (BASE_KEYS.includes(key)) continue;
    const margin = EMOTION_CONFIG.DOMINANCE_MARGIN_OVERRIDES[key] ?? EMOTION_CONFIG.DOMINANCE_MARGIN;
    candidates[key] = value >= topBaseValue * margin ? value : 0;
  }

  const sorted = Object.entries(candidates).sort((a, b) => b[1] - a[1]);
  const [topEmotion, topValue] = sorted[0];
  const [, secondValue = 0] = sorted[1] ?? [];
  const currentValue = candidates[current] ?? 0;

  let winner, reason;
  if (currentValue === 0 && topEmotion !== current) {
    winner = topEmotion;
    reason = `current "${current}" is no longer a live candidate (value 0); leader "${topEmotion}" takes over`;
  } else if (topEmotion !== current && topValue - currentValue < EMOTION_CONFIG.DOMINANCE_THRESHOLD) {
    winner = current;
    reason = `lead over current (${fmt(topValue - currentValue)}) < DOMINANCE_THRESHOLD (${EMOTION_CONFIG.DOMINANCE_THRESHOLD}); holding current`;
  } else if (topValue - secondValue < EMOTION_CONFIG.HYSTERESIS_THRESHOLD) {
    winner = current;
    reason = `top-two gap (${fmt(topValue - secondValue)}) < HYSTERESIS_THRESHOLD (${EMOTION_CONFIG.HYSTERESIS_THRESHOLD}); holding current`;
  } else {
    winner = topEmotion;
    reason = `"${topEmotion}" leads decisively and clears both thresholds`;
  }

  return {
    candidates,
    sorted,
    winner,
    reason,
    margin: topValue - secondValue,
    hysteresis: EMOTION_CONFIG.HYSTERESIS_THRESHOLD,
  };
}

/** DISPLAY-ONLY mirror of clampEmotion.js's branch logic. */
function computeClampDiagnostics(current, next, confidence) {
  if (confidence < EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE) {
    return {
      before: current,
      after: current,
      reason: `confidence ${fmt(confidence)} < MIN_CONFIDENCE_TO_CHANGE (${EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE}); change blocked`,
    };
  }
  if (current === next) {
    return { before: current, after: current, reason: "no-op — proposed next equals current" };
  }

  const currentIsBase = BASE_EMOTIONS_DISPLAY.includes(current);
  const nextIsBase = BASE_EMOTIONS_DISPLAY.includes(next);

  if (!currentIsBase && nextIsBase && confidence < 0.85) {
    return {
      before: current,
      after: current,
      reason: `composite -> base exit blocked: confidence ${fmt(confidence)} < 0.85 required to leave composite "${current}"`,
    };
  }
  if (currentIsBase && !nextIsBase) {
    return { before: current, after: next, reason: "base -> composite transition allowed freely" };
  }
  return { before: current, after: next, reason: "transition allowed (base->base, or composite exit with sufficient confidence)" };
}

/* =====================================================
   MAIN EVALUATION LOOP
===================================================== */
mkdirSync(REPORT_DIR, { recursive: true });

const cases = CATEGORY_FILTER ? TEST_CASES.filter((c) => c.category === CATEGORY_FILTER) : TEST_CASES;

const results = [];
let mirrorIntegrityIssues = 0;

for (const tc of cases) {
  let field = { happy: 0, sad: 0, angry: 0 };
  let current = "silent";
  const turnRecords = [];

  log(SEP);
  log(`TEST ${tc.id}  [${tc.category}]  (${tc.turns.length} turn${tc.turns.length > 1 ? "s" : ""})`);

  for (let ti = 0; ti < tc.turns.length; ti++) {
    const turn = tc.turns[ti];
    const isLast = ti === tc.turns.length - 1;
    const scores = turn.scores;

    const realConfidence = scores.length ? Math.max(...scores.map((s) => s.score)) : 0;
    const clampConfidence = USE_REAL_CONFIDENCE ? realConfidence : 1.0;

    const forces = computeForces(scores);
    const edge = computeEdge(scores);
    const matched = computeMatchedRules(scores);

    // --- REAL PIPELINE CALLS (these decide everything) ---
    const nextField = updateEmotionField(field, { ...forces, edge }, 1000);
    const dominant = getDominantEmotion(nextField, current);
    const clamped = clampEmotion(current, dominant, clampConfidence);

    // --- diagnostic mirrors (display only, cross-checked below) ---
    const compositeDiag = computeCompositeDiagnostics(
      { happy: nextField.happy, sad: nextField.sad, angry: nextField.angry },
      edge,
      nextField
    );
    const dominanceDiag = computeDominanceDiagnostics(nextField, current);
    const clampDiag = computeClampDiagnostics(current, dominant, clampConfidence);

    const dominanceMismatch = dominanceDiag.winner !== dominant;
    const clampMismatch = clampDiag.after !== clamped;
    if (dominanceMismatch || clampMismatch) {
      mirrorIntegrityIssues++;
      console.warn(
        `!! DIAGNOSTIC MIRROR MISMATCH on ${tc.id} turn ${ti + 1} !! ` +
          `dominance: mirror=${dominanceDiag.winner} real=${dominant} (mismatch=${dominanceMismatch}); ` +
          `clamp: mirror=${clampDiag.after} real=${clamped} (mismatch=${clampMismatch}). ` +
          `The mirror's diagnostic text may be misleading for this turn — the PASS/FAIL verdict is unaffected, it always uses the real values.`
      );
    }

    if (!QUIET) {
      console.log(`\n[turn ${ti + 1}/${tc.turns.length}]`);
      console.log(section("INPUT", [turn.text === "" ? "(empty string)" : JSON.stringify(turn.text).slice(1, -1)]));

      const shown = scores.filter((s) => s.score > NOISE_FLOOR_DISPLAY).sort((a, b) => b.score - a.score);
      console.log(
        section("TRANSFORMER", [
          `Raw labels/scores (${scores.length} total labels; showing ${shown.length} above ${NOISE_FLOOR_DISPLAY} display floor):`,
          ...(shown.length ? shown.map((s) => `  ${s.label}: ${fmt(s.score)}`) : ["  (none above display floor)"]),
        ])
      );

      console.log(
        section("FORCES", [
          `happy: ${fmt(forces.happy)}`,
          `sad:   ${fmt(forces.sad)}`,
          `angry: ${fmt(forces.angry)}`,
          `edge:  ${fmt(edge)}`,
        ])
      );

      console.log(
        section("LINGUISTIC CUES", [
          "(this engine has no rule engine separate from FORCE_MAP/EDGE_MAP weighting — see script header)",
          `Matched rules (FORCE_MAP labels >= ${NOISE_FLOOR_DISPLAY} noise floor):`,
          ...(matched.length ? matched.map((m) => `  ${m.label} (score ${fmt(m.score)}): ${m.contribution}`) : ["  (none)"]),
          `Confidence (max label score): ${fmt(realConfidence)}${
            USE_REAL_CONFIDENCE ? "" : "  [clamp gate uses 1.0 per run-regression.mjs convention — see header; pass --use-real-confidence to change]"
          }`,
          `Reasons: each matched label's score is multiplied by its FORCE_MAP weight vector and summed into {happy,sad,angry}; EDGE_MAP labels (disgust/fear/nervousness) are summed the same way into edge.`,
        ])
      );

      console.log(
        section(
          "COMPOSITES",
          COMPOSITE_KEYS.flatMap((key) => {
            const d = compositeDiag[key];
            return [
              `[${key}]`,
              `  Transformer score: N/A — composites consume normalized base shares, not a raw transformer score (see header)`,
              `  Cue score: N/A — no separate cue-scoring subsystem in this engine (see header)`,
              `  Combined score: N/A — see "Final composite score" below`,
              `  Normalized shares: happy=${fmt(d.normalizedShares.happy)} sad=${fmt(d.normalizedShares.sad)} angry=${fmt(d.normalizedShares.angry)}  edge=${fmt(d.edge)}`,
              `  Threshold (COMPOSITE_THRESHOLD): ${d.threshold ? JSON.stringify(d.threshold) : "(none configured for this key)"}`,
              `  Gate passed: ${d.gatePassed}`,
              `  Bypass: N/A — composite.js has no bypass mechanism`,
              `  Final composite score: ${fmt(d.finalScore)}`,
            ];
          })
        )
      );

      console.log(
        section("DOMINANCE", [
          `Candidate list: ${
            Object.keys(dominanceDiag.candidates).length
              ? Object.entries(dominanceDiag.candidates)
                  .map(([k, v]) => `${k}=${fmt(v)}`)
                  .join(", ")
              : "(rest-state — no candidates, base energy below floor)"
          }`,
          `Sorted scores: ${dominanceDiag.sorted.length ? dominanceDiag.sorted.map(([k, v]) => `${k}:${fmt(v)}`).join(" > ") : "(n/a)"}`,
          `Winner (real getDominantEmotion()): ${dominant}${dominanceMismatch ? "   [mirror mismatch, see warning above]" : ""}`,
          `Reason winner won: ${dominanceDiag.reason}`,
          `Margin (top - second): ${dominanceDiag.margin === null ? "n/a" : fmt(dominanceDiag.margin)}`,
          `Hysteresis threshold: ${dominanceDiag.hysteresis === null ? "n/a" : dominanceDiag.hysteresis}`,
        ])
      );

      console.log(
        section("CLAMP", [
          `Before: ${clampDiag.before}`,
          `After (real clampEmotion()): ${clamped}${clampMismatch ? "   [mirror mismatch, see warning above]" : ""}`,
          `Reason: ${clampDiag.reason}`,
        ])
      );

      console.log(
        section(
          "FINAL",
          isLast
            ? [`Expected: ${tc.expect}`, `Predicted: ${clamped}`, clamped === tc.expect ? "PASS" : "FAIL"]
            : ["(intermediate turn of a multi-turn case — PASS/FAIL is evaluated on the final turn only)", `Predicted (interim state): ${clamped}`]
        )
      );
    }

    turnRecords.push({
      turnIndex: ti,
      text: turn.text,
      scores,
      confidence: realConfidence,
      clampConfidenceUsed: clampConfidence,
      forces,
      edge,
      matchedRules: matched.map((m) => ({ label: m.label, score: m.score, contribution: m.contribution })),
      compositeDiag,
      dominanceDiag,
      clampDiag,
      dominant,
      clamped,
      dominanceMismatch,
      clampMismatch,
    });

    field = nextField;
    current = clamped;
  }

  const finalTurn = turnRecords[turnRecords.length - 1];
  const predicted = finalTurn.clamped;
  const pass = predicted === tc.expect;

  results.push({
    id: tc.id,
    category: tc.category,
    expected: tc.expect,
    predicted,
    pass,
    turnCount: tc.turns.length,
    finalConfidence: finalTurn.confidence,
    finalDominanceMargin: finalTurn.dominanceDiag.margin,
    winningComposite: COMPOSITE_KEYS.includes(predicted) ? predicted : null,
    turns: turnRecords,
  });
}

log(SEP);

/* =====================================================
   AGGREGATE STATS
===================================================== */
const totalTests = results.length;
const totalTurns = results.reduce((s, r) => s + r.turnCount, 0);
const passed = results.filter((r) => r.pass).length;
const failed = totalTests - passed;
const accuracy = totalTests ? passed / totalTests : 0;

// Per-emotion accuracy
const perEmotionAccuracy = {};
for (const r of results) {
  const bucket = (perEmotionAccuracy[r.expected] ??= { total: 0, passed: 0 });
  bucket.total++;
  if (r.pass) bucket.passed++;
}
for (const label of Object.keys(perEmotionAccuracy)) {
  const b = perEmotionAccuracy[label];
  b.accuracy = b.total ? b.passed / b.total : 0;
}

// Confusion matrix: confusionMatrix[expected][predicted] = count
const confusionMatrix = {};
for (const r of results) {
  const row = (confusionMatrix[r.expected] ??= {});
  row[r.predicted] = (row[r.predicted] ?? 0) + 1;
}

// False positives / negatives per label
const allLabels = new Set();
for (const r of results) {
  allLabels.add(r.expected);
  allLabels.add(r.predicted);
}
const falsePositives = {};
const falseNegatives = {};
for (const label of allLabels) {
  falsePositives[label] = results.filter((r) => r.predicted === label && r.expected !== label).map((r) => ({ id: r.id, expected: r.expected, predicted: r.predicted }));
  falseNegatives[label] = results.filter((r) => r.expected === label && r.predicted !== label).map((r) => ({ id: r.id, expected: r.expected, predicted: r.predicted }));
}

// Top 20 worst failures: failing cases, ranked by how decisively the dominance
// call was won (bigger margin = more confidently wrong, not a marginal near-tie).
const topWorstFailures = results
  .filter((r) => !r.pass)
  .slice()
  .sort((a, b) => (b.finalDominanceMargin ?? 0) - (a.finalDominanceMargin ?? 0))
  .slice(0, 20)
  .map((r) => ({
    id: r.id,
    category: r.category,
    text: r.turns[r.turns.length - 1].text,
    expected: r.expected,
    predicted: r.predicted,
    finalDominanceMargin: r.finalDominanceMargin,
  }));

// Top 20 weakest-confidence predictions (across ALL results, pass or fail)
const topWeakestConfidence = results
  .slice()
  .sort((a, b) => a.finalConfidence - b.finalConfidence)
  .slice(0, 20)
  .map((r) => ({
    id: r.id,
    category: r.category,
    text: r.turns[r.turns.length - 1].text,
    expected: r.expected,
    predicted: r.predicted,
    pass: r.pass,
    finalConfidence: r.finalConfidence,
  }));

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

const averageConfidence = avg(results.map((r) => r.finalConfidence));
// "Transformer contribution": average total raw force energy (happy+sad+angry)
// injected from the transformer's weighted labels on the final turn.
const averageTransformerContribution = avg(
  results.map((r) => {
    const f = r.turns[r.turns.length - 1].forces;
    return f.happy + f.sad + f.angry;
  })
);
// "Cue contribution": average number of FORCE_MAP labels that cleared the
// noise floor on the final turn (proxy — see header notes on why there's no
// separate cue-scoring subsystem to average instead).
const averageCueContribution = avg(results.map((r) => r.turns[r.turns.length - 1].matchedRules.length));
// "Composite contribution": average final composite score, over only the
// cases where a composite actually won.
const compositeWinners = results.filter((r) => r.winningComposite);
const averageCompositeContribution = avg(
  compositeWinners.map((r) => r.turns[r.turns.length - 1].compositeDiag[r.winningComposite].finalScore)
);
// Average dominance margin (top candidate minus runner-up), excluding rest-state turns.
const marginSamples = results.map((r) => r.finalDominanceMargin).filter((m) => m !== null);
const averageDominanceMargin = avg(marginSamples);

const summary = {
  totalTests,
  totalTurns,
  passed,
  failed,
  accuracy,
  perEmotionAccuracy,
  confusionMatrix,
  falsePositives,
  falseNegatives,
  topWorstFailures,
  topWeakestConfidence,
  averages: {
    confidence: averageConfidence,
    cueContribution: averageCueContribution,
    transformerContribution: averageTransformerContribution,
    compositeContribution: averageCompositeContribution,
    compositeContributionSampleSize: compositeWinners.length,
    dominanceMargin: averageDominanceMargin,
  },
  mirrorIntegrityIssues,
};

/* =====================================================
   CONSOLE SUMMARY
===================================================== */
console.log(`\nTotal tests: ${totalTests}   Total turns: ${totalTurns}`);
console.log(`Passed: ${passed}   Failed: ${failed}   Accuracy: ${(accuracy * 100).toFixed(1)}%\n`);

console.log("Per-emotion accuracy:");
for (const [label, b] of Object.entries(perEmotionAccuracy).sort()) {
  console.log(`  ${label.padEnd(14)} ${b.passed}/${b.total}  (${(b.accuracy * 100).toFixed(1)}%)`);
}

console.log("\nConfusion matrix (rows=expected, cols=predicted):");
const predictedLabels = [...allLabels].sort();
console.log(`  ${"".padEnd(14)} ${predictedLabels.map((l) => l.slice(0, 6).padStart(7)).join("")}`);
for (const expected of [...allLabels].sort()) {
  const row = confusionMatrix[expected] ?? {};
  console.log(`  ${expected.padEnd(14)} ${predictedLabels.map((p) => String(row[p] ?? 0).padStart(7)).join("")}`);
}

console.log(`\nFalse positives (predicted X when expected != X):`);
for (const [label, list] of Object.entries(falsePositives)) {
  if (list.length) console.log(`  ${label}: ${list.length}  [${list.map((l) => l.id).join(", ")}]`);
}
console.log(`\nFalse negatives (expected X, predicted != X):`);
for (const [label, list] of Object.entries(falseNegatives)) {
  if (list.length) console.log(`  ${label}: ${list.length}  [${list.map((l) => l.id).join(", ")}]`);
}

console.log(`\nTop ${Math.min(20, topWorstFailures.length)} worst failures (failing + most decisive dominance margin):`);
for (const f of topWorstFailures) {
  console.log(`  [${f.id}] expected=${f.expected} predicted=${f.predicted} margin=${fmt(f.finalDominanceMargin)} :: "${f.text}"`);
}

console.log(`\nTop ${Math.min(20, topWeakestConfidence.length)} weakest-confidence predictions:`);
for (const f of topWeakestConfidence) {
  console.log(`  [${f.id}] conf=${fmt(f.finalConfidence)} expected=${f.expected} predicted=${f.predicted} ${f.pass ? "PASS" : "FAIL"} :: "${f.text}"`);
}

console.log(`\nAverages:`);
console.log(`  confidence:                ${fmt(averageConfidence)}`);
console.log(`  cue contribution (proxy):  ${fmt(averageCueContribution)}`);
console.log(`  transformer contribution:  ${fmt(averageTransformerContribution)}`);
console.log(`  composite contribution:    ${fmt(averageCompositeContribution)}  (n=${compositeWinners.length} composite-winning cases)`);
console.log(`  dominance margin:          ${fmt(averageDominanceMargin)}`);

if (mirrorIntegrityIssues > 0) {
  console.warn(`\n!! ${mirrorIntegrityIssues} diagnostic-mirror mismatch(es) occurred — see warnings above. PASS/FAIL verdicts are unaffected (they never use the mirror), but some printed "Reason"/"Candidate list" text may be unreliable for those specific turns. !!`);
}

/* =====================================================
   EXPORT REPORTS
===================================================== */
const generatedAt = new Date().toISOString();

// ---- JSON: full structured dump, everything ----
const jsonReport = {
  meta: { generatedAt, useRealConfidence: USE_REAL_CONFIDENCE, categoryFilter: CATEGORY_FILTER },
  summary,
  results,
};
writeFileSync(path.join(REPORT_DIR, "evaluation-report.json"), JSON.stringify(jsonReport, null, 2));

// ---- CSV: one row per test case (flat summary) ----
const csvHeader = ["id", "category", "expected", "predicted", "pass", "turnCount", "finalConfidence", "finalDominanceMargin", "winningComposite"];
const csvRows = results.map((r) =>
  [r.id, r.category, r.expected, r.predicted, r.pass, r.turnCount, fmt(r.finalConfidence), r.finalDominanceMargin === null ? "" : fmt(r.finalDominanceMargin), r.winningComposite ?? ""]
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(",")
);
writeFileSync(path.join(REPORT_DIR, "evaluation-report.csv"), [csvHeader.join(","), ...csvRows].join("\n") + "\n");

// ---- MD: human-readable summary + failure/weak-confidence detail ----
const md = [];
md.push(`# Evaluation report`, "", `Generated: ${generatedAt}`, `Config: useRealConfidence=${USE_REAL_CONFIDENCE}, categoryFilter=${CATEGORY_FILTER ?? "(none)"}`, "");
md.push(
  `> **Scope note:** full per-turn diagnostic traces (raw label scores, forces, composite gates, dominance candidates, clamp reasons) for every test are in \`evaluation-report.json\`. This file has the aggregate stats and expanded detail for failures / low-confidence cases only. See the harness script's header comment for which report fields don't have a real equivalent in this engine (composites have no separate "transformer score"/"cue score"/"bypass" — those print as N/A in the console trace and JSON).`,
  ""
);
md.push(`## Summary`, "");
md.push(`- Total tests: **${totalTests}**  (${totalTurns} total turns)`);
md.push(`- Passed: **${passed}**`);
md.push(`- Failed: **${failed}**`);
md.push(`- Accuracy: **${(accuracy * 100).toFixed(1)}%**`);
if (mirrorIntegrityIssues > 0) {
  md.push(`- ⚠️ ${mirrorIntegrityIssues} diagnostic-mirror mismatch(es) — see console output / JSON for detail. Verdicts are unaffected.`);
}
md.push("");

md.push(`## Per-emotion accuracy`, "", "| Emotion | Passed | Total | Accuracy |", "|---|---|---|---|");
for (const [label, b] of Object.entries(perEmotionAccuracy).sort()) {
  md.push(`| ${label} | ${b.passed} | ${b.total} | ${(b.accuracy * 100).toFixed(1)}% |`);
}
md.push("");

md.push(`## Confusion matrix`, "", `Rows = expected, columns = predicted.`, "");
md.push(`| expected \\ predicted | ${predictedLabels.join(" | ")} |`);
md.push(`|---|${predictedLabels.map(() => "---").join("|")}|`);
for (const expected of [...allLabels].sort()) {
  const row = confusionMatrix[expected] ?? {};
  md.push(`| **${expected}** | ${predictedLabels.map((p) => row[p] ?? 0).join(" | ")} |`);
}
md.push("");

md.push(`## False positives`, "");
for (const [label, list] of Object.entries(falsePositives)) {
  if (list.length) md.push(`- **${label}**: ${list.length}  (${list.map((l) => l.id).join(", ")})`);
}
md.push("", `## False negatives`, "");
for (const [label, list] of Object.entries(falseNegatives)) {
  if (list.length) md.push(`- **${label}**: ${list.length}  (${list.map((l) => l.id).join(", ")})`);
}
md.push("");

md.push(`## Top ${topWorstFailures.length} worst failures`, "", "(failing cases, ranked by how decisively the dominance call was won)", "", "| id | expected | predicted | margin | text |", "|---|---|---|---|---|");
for (const f of topWorstFailures) {
  md.push(`| ${f.id} | ${f.expected} | ${f.predicted} | ${fmt(f.finalDominanceMargin)} | ${f.text.replace(/\|/g, "\\|")} |`);
}
md.push("");

md.push(`## Top ${topWeakestConfidence.length} weakest-confidence predictions`, "", "| id | confidence | expected | predicted | pass | text |", "|---|---|---|---|---|---|");
for (const f of topWeakestConfidence) {
  md.push(`| ${f.id} | ${fmt(f.finalConfidence)} | ${f.expected} | ${f.predicted} | ${f.pass ? "PASS" : "FAIL"} | ${f.text.replace(/\|/g, "\\|")} |`);
}
md.push("");

md.push(`## Averages`, "");
md.push(`- confidence: ${fmt(averageConfidence)}`);
md.push(`- cue contribution (proxy — count of FORCE_MAP labels above noise floor): ${fmt(averageCueContribution)}`);
md.push(`- transformer contribution (avg total raw force energy): ${fmt(averageTransformerContribution)}`);
md.push(`- composite contribution (avg final score, composite-winning cases only, n=${compositeWinners.length}): ${fmt(averageCompositeContribution)}`);
md.push(`- dominance margin: ${fmt(averageDominanceMargin)}`);
md.push("");

writeFileSync(path.join(REPORT_DIR, "evaluation-report.md"), md.join("\n") + "\n");

console.log(`\nReports written to:\n  ${path.join(REPORT_DIR, "evaluation-report.json")}\n  ${path.join(REPORT_DIR, "evaluation-report.csv")}\n  ${path.join(REPORT_DIR, "evaluation-report.md")}`);

// Exit non-zero on failure so this can be wired into CI.
process.exit(failed > 0 ? 1 : 0);
