import { getCleanDirRates, getDirRatesMin, extractOrderedRateIds } from "../helper";
import { getData, getObject, pushListJSON, setData } from "../redis";
import { IExchanger } from "../types/exchanger";
import { IAllRatesID } from "../types/rates";

// Shape of parser's `exchanger_stats:<id>` entries (see parser/src/types/exchanger.ts).
type IExchangerStats = {
  skip?: number;
  // parser writes `{}` on success and { code, autoMessage, comment } on failure
  error?: string | { code?: string; autoMessage?: string; comment?: string } | null;
  total_rates?: number;
  warning?: string[];
  time?: number;
};

// Hourly snapshots of every direction and exchanger, kept in capped Redis lists.
// This is the data nobody else has: how the best rate moved, how many exchangers served a
// direction, and whether an exchanger was actually up. Pages read it via routes/history.

export const HISTORY_POINTS_MAX = 24 * 45; // 45 days of hourly points
export const DIR_HISTORY_KEY = (dir: string) => `hist:dir:${dir.toUpperCase()}`;
export const EXCHANGER_HISTORY_KEY = (id: string) => `hist:ex:${id}`;
const LAST_RUN_KEY = "hist:meta:last_run";
const MIN_GAP_MS = 50 * 60 * 1000; // never store two snapshots closer than this
const BOOT_DELAY_MS = 90 * 1000;

export type DirHistoryPoint = {
  t: number; // ms epoch
  n: number; // offers
  best: number; // lowest course (best for the user)
  med: number;
  worst: number;
  res: number; // total reserve on the "get" side
};

export type ExchangerHistoryPoint = {
  t: number;
  ok: 0 | 1; // 1 = rates fetched without error
  n: number; // rates served
  e?: string | null; // error code when down
};

// Parser stores `{}` as "no error"; only a non-empty object or a non-empty string means the exchanger is down.
export const errorCode = (error: IExchangerStats["error"]): string | null => {
  if (!error) return null;
  if (typeof error === "string") return error.trim() ? error.slice(0, 40) : null;
  if (typeof error !== "object" || !Object.keys(error).length) return null;
  const code = error.code || error.autoMessage || error.comment || "ERROR";
  return String(code).slice(0, 40);
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const round = (value: number, digits = 8) => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toPrecision(digits));
};

export const buildDirPoint = (
  t: number,
  courses: number[],
  reserves: number[]
): DirHistoryPoint | null => {
  const valid = courses.filter((c) => Number.isFinite(c) && c > 0);
  if (!valid.length) return null;
  const res = reserves.reduce(
    (sum, r) => sum + (Number.isFinite(r) && r > 0 ? r : 0),
    0
  );
  return {
    t,
    n: valid.length,
    best: round(Math.min(...valid)),
    med: round(median(valid)),
    worst: round(Math.max(...valid)),
    res: Math.round(res),
  };
};

const listDirs = async (): Promise<string[]> => {
  const allRatesID = (await getObject("allRatesID")) as IAllRatesID | null;
  if (!allRatesID) return [];
  const min = getDirRatesMin();
  return Object.entries(allRatesID)
    .filter(([, entries]) => extractOrderedRateIds(entries).length >= min)
    .map(([dir]) => dir);
};

export const collectHistorySnapshot = async (): Promise<{
  dirs: number;
  exchangers: number;
}> => {
  const t = Date.now();
  const dirs = await listDirs();
  let storedDirs = 0;
  for (const dir of dirs) {
    const rates = await getCleanDirRates(dir);
    const point = buildDirPoint(
      t,
      rates.map((r) => Number(r.course)),
      rates.map((r) => Number(r.reserve?.get))
    );
    if (!point) continue;
    await pushListJSON(DIR_HISTORY_KEY(dir), point, HISTORY_POINTS_MAX);
    storedDirs++;
  }

  const exchangers = ((await getObject("exchangers")) || {}) as Record<
    string,
    IExchanger
  >;
  const stats = ((await getObject("exchanger_stats")) || {}) as Record<
    string,
    IExchangerStats
  >;
  let storedExchangers = 0;
  for (const id of Object.keys(exchangers)) {
    const stat = stats[id] || {};
    const e = errorCode(stat.error);
    const point: ExchangerHistoryPoint = {
      t,
      ok: e ? 0 : 1,
      n: Number(stat.total_rates) || 0,
      e,
    };
    await pushListJSON(EXCHANGER_HISTORY_KEY(id), point, HISTORY_POINTS_MAX);
    storedExchangers++;
  }

  await setData(LAST_RUN_KEY, t, 0);
  console.log(
    `[history] snapshot at ${new Date(t).toISOString()}: ${storedDirs} dirs, ${storedExchangers} exchangers`
  );
  return { dirs: storedDirs, exchangers: storedExchangers };
};

const runIfDue = async () => {
  try {
    const last = Number(await getData(LAST_RUN_KEY)) || 0;
    if (Date.now() - last < MIN_GAP_MS) return;
    await collectHistorySnapshot();
  } catch (error) {
    console.error("[history] snapshot failed:", error);
  }
};

// One snapshot shortly after boot (if none is recent), then every hour at :02.
export const startHistoryCollector = () => {
  setTimeout(runIfDue, BOOT_DELAY_MS);
  const scheduleHourly = () => {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(2, 0, 0);
    if (next <= now) next.setHours(next.getHours() + 1);
    setTimeout(async () => {
      await runIfDue();
      scheduleHourly();
    }, next.getTime() - now.getTime());
  };
  scheduleHourly();
};
