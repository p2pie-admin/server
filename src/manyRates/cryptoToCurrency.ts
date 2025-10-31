import { type } from "os";
import { getCleanDirRates } from "../helper";
import getPossiblePairs from "../possiblePairs";
import { IRate } from "../types/rates";
export const getCryptoToCurrencyRates = async ({
  code,
  currency,
  side,
}: {
  code: string;
  currency: string;
  side: "give" | "get";
}) => {
  if (!code) return [];

  const possiblePairs = (await getPossiblePairs({ code, side })) as
    | string[]
    | undefined;
  if (!possiblePairs || !possiblePairs.length) return [];

  const fiatPairs = possiblePairs.filter((p) => p.includes(currency));
  if (!fiatPairs.length) return [];

  const ratesByDir: { [dir: string]: IRate[] } = {};
  await Promise.all(
    fiatPairs.map(async (fiatCode) => {
      const dir =
        side === "give" ? `${code}_${fiatCode}` : `${fiatCode}_${code}`;
      const cleanDirRates = (await getCleanDirRates(dir, "all")) || [];
      ratesByDir[dir] = cleanDirRates;
    })
  );

  const flatRates = Object.entries(ratesByDir).flatMap(([dir, dirRates]) => {
    const [left, right] = dir.split("_");
    const code = side === "give" ? right : left;
    return (dirRates || []).map((rate) => {
      const { cityRates, reserve, ...rest } = rate as any;
      return { ...rest, code } as any;
    });
  });

  // custom merge: same exchanger, course difference <0.5% → merge
  const merged: any[] = [];
  for (const rate of flatRates) {
    const existing = merged.find((m) => {
      if (m.exchangerId !== rate.exchangerId) return false;
      const diff =
        Math.abs(m.course - rate.course) / ((m.course + rate.course) / 2);
      return diff < 0.05; // 1%
    });

    if (!existing) {
      merged.push({
        exchangerId: rate.exchangerId,
        name: rate.name,
        admin_rating: rate.admin_rating,
        logo: rate.logo,
        course: rate.course,
        parameterCodes: Array.isArray(rate.parameterCodes)
          ? [...rate.parameterCodes]
          : [],
        ref_link: rate.ref_link,
        last_time_updated: rate.last_time_updated,
        min: rate.min ? { ...rate.min } : null,
        max: rate.max ? { ...rate.max } : null,
        codes: [rate.code],
      });
      continue;
    }

    // merge into existing
    existing.codes.push(rate.code);

    // keep the highest course
    existing.course = Math.max(existing.course, rate.course);

    // merge min
    if (rate.min) {
      if (!existing.min) existing.min = { ...rate.min };
      else {
        existing.min.give = Math.min(
          existing.min.give ?? Infinity,
          rate.min.give ?? Infinity
        );
        existing.min.get = Math.min(
          existing.min.get ?? Infinity,
          rate.min.get ?? Infinity
        );
      }
    }

    // merge max
    if (rate.max) {
      if (!existing.max) existing.max = { ...rate.max };
      else {
        existing.max.give = Math.max(
          existing.max.give ?? -Infinity,
          rate.max.give ?? -Infinity
        );
        existing.max.get = Math.max(
          existing.max.get ?? -Infinity,
          rate.max.get ?? -Infinity
        );
      }
    }

    // merge parameterCodes
    existing.parameterCodes = Array.from(
      new Set([
        ...(existing.parameterCodes || []),
        ...(rate.parameterCodes || []),
      ])
    );

    // last_time_updated = most recent
    existing.last_time_updated = Math.max(
      existing.last_time_updated || 0,
      rate.last_time_updated || 0
    );
  }

  // dedupe codes + sort by course asc
  const final = merged.map((item) => ({
    ...item,
    codes: Array.from(new Set(item.codes)),
  }));

  final.sort((a, b) => a.course - b.course);

  return final;
};
