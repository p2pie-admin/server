import { FastifyReply, FastifyRequest } from "fastify";

import { toCache } from "../../helper";
import { getListJSON } from "../../redis";
import {
  DirHistoryPoint,
  DIR_HISTORY_KEY,
  ExchangerHistoryPoint,
  EXCHANGER_HISTORY_KEY,
} from "../../history/collector";

const MAX_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseDays = (raw: unknown, fallback: number) => {
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) return fallback;
  return Math.min(MAX_DAYS, Math.ceil(days));
};

const sincePoints = <T extends { t: number }>(points: T[], days: number) => {
  const from = Date.now() - days * DAY_MS;
  return points.filter((p) => p && Number.isFinite(p.t) && p.t >= from);
};

const changePercent = (from: number, to: number) =>
  from > 0 ? ((to - from) / from) * 100 : 0;

export type DirHistorySummary = {
  days: number;
  points: number;
  first: number | null;
  last: number | null;
  bestMin: number; // best course seen in the period (lowest)
  bestMax: number; // worst value of the best course in the period
  bestAvg: number;
  bestLast: number;
  change24hPct: number | null; // best course now vs ~24h ago
  changePeriodPct: number | null; // best course now vs first point of the period
  offersAvg: number;
  offersMin: number;
  offersMax: number;
};

export const summarizeDir = (
  points: DirHistoryPoint[],
  days: number
): DirHistorySummary | null => {
  if (!points.length) return null;
  const bests = points.map((p) => p.best);
  const offers = points.map((p) => p.n);
  const last = points[points.length - 1];
  const dayAgo = points.find((p) => p.t >= last.t - DAY_MS) || points[0];
  return {
    days,
    points: points.length,
    first: points[0].t,
    last: last.t,
    bestMin: Math.min(...bests),
    bestMax: Math.max(...bests),
    bestAvg: bests.reduce((a, b) => a + b, 0) / bests.length,
    bestLast: last.best,
    change24hPct:
      points.length > 1 && dayAgo !== last
        ? changePercent(dayAgo.best, last.best)
        : null,
    changePeriodPct:
      points.length > 1 ? changePercent(points[0].best, last.best) : null,
    offersAvg: offers.reduce((a, b) => a + b, 0) / offers.length,
    offersMin: Math.min(...offers),
    offersMax: Math.max(...offers),
  };
};

// GET /history/dir=:code?days=7  -> { points, summary }
export const dirHistoryHandler = async (
  request: FastifyRequest<{
    Params: { code: string };
    Querystring: { days?: string };
  }>,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const code = String(request.params.code || "").toUpperCase();
  const days = parseDays(request.query?.days, 7);
  const data = await toCache({
    key: `history_dir_${code}_${days}`,
    ttl: 10 * 60 * 1000,
    getData: async () => {
      const all = await getListJSON<DirHistoryPoint>(
        DIR_HISTORY_KEY(code),
        days * 24 + 2
      );
      const points = sincePoints(all, days);
      return { code, days, points, summary: summarizeDir(points, days) };
    },
  });
  reply.send(JSON.stringify(data));
};

export type ExchangerHistorySummary = {
  days: number;
  points: number;
  uptimePct: number; // share of hourly checks that succeeded
  downHours: number;
  ratesAvg: number;
  lastOk: number | null; // last successful check
  lastError: string | null;
};

export const summarizeExchanger = (
  points: ExchangerHistoryPoint[],
  days: number
): ExchangerHistorySummary | null => {
  if (!points.length) return null;
  const okCount = points.filter((p) => p.ok).length;
  const lastOkPoint = [...points].reverse().find((p) => p.ok) || null;
  const last = points[points.length - 1];
  return {
    days,
    points: points.length,
    uptimePct: (okCount / points.length) * 100,
    downHours: points.length - okCount,
    ratesAvg: points.reduce((a, p) => a + (p.n || 0), 0) / points.length,
    lastOk: lastOkPoint ? lastOkPoint.t : null,
    lastError: last.ok ? null : last.e || "unknown",
  };
};

// GET /history/exchanger/:id?days=30 -> { points, summary }
export const exchangerHistoryHandler = async (
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { days?: string };
  }>,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const id = String(request.params.id || "");
  const days = parseDays(request.query?.days, 30);
  const data = await toCache({
    key: `history_ex_${id}_${days}`,
    ttl: 10 * 60 * 1000,
    getData: async () => {
      const all = await getListJSON<ExchangerHistoryPoint>(
        EXCHANGER_HISTORY_KEY(id),
        days * 24 + 2
      );
      const points = sincePoints(all, days);
      return { id, days, points, summary: summarizeExchanger(points, days) };
    },
  });
  reply.send(JSON.stringify(data));
};
