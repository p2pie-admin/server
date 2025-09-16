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

  const currencyPairs = possiblePairs.filter((p) => p.endsWith(currency));
  if (!currencyPairs.length) return [];

  const ratesByDir: { [dir: string]: IRate[] } = {};

  await Promise.all(
    currencyPairs.map(async (cur_code) => {
      const dir =
        side === "give" ? `${code}_${cur_code}` : `${cur_code}_${code}`;
      const cleanDirRates = (await getCleanDirRates(dir, "all")) || [];
      ratesByDir[dir] = cleanDirRates;
    })
  );

  // Flatten, strip cityRates & reserve, and attach the proper code depending on side:
  const flatRates = Object.entries(ratesByDir).flatMap(([dir, dirRates]) => {
    const [left, right] = dir.split("_");
    const codePart = side === "give" ? right : left; // <- FIX: use right for give, left for get
    return (dirRates || []).map((rate) => {
      // remove cityRates and reserve explicitly
      const { cityRates, reserve, ...rest } = rate as any;
      return { ...rest, code: codePart } as any;
    });
  });

  // Group by exchangerId + course
  const grouped = new Map<string, any>();

  for (const rate of flatRates) {
    const key = `${rate.exchangerId}_${String(rate.course)}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        // shallow clone important fields; we'll keep the rest from the first encountered rate
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
        // min/max — copy
        min: { ...(rate.min || {}) },
        max: { ...(rate.max || {}) },
        codes: [rate.code],
      });
      continue;
    }

    const existing = grouped.get(key);

    // collect codes
    existing.codes.push(rate.code);

    // min: pick smallest (safe-guard with nullish)
    if (rate.min) {
      if (existing.min == null) existing.min = { ...rate.min };
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

    // max: pick largest
    if (rate.max) {
      if (existing.max == null) existing.max = { ...rate.max };
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

    // merge parameterCodes union
    existing.parameterCodes = Array.from(
      new Set([
        ...(existing.parameterCodes || []),
        ...(rate.parameterCodes || []),
      ])
    );

    // update last_time_updated to the most recent one
    existing.last_time_updated = Math.max(
      existing.last_time_updated || 0,
      rate.last_time_updated || 0
    );

    // keep other top-level fields (name/admin_rating/logo/ref_link) from first occurrence — they should be identical per exchanger
  }

  // Finalize -> array, dedupe codes and sort by course asc
  const merged = Array.from(grouped.values()).map((item) => ({
    ...item,
    codes: Array.from(new Set(item.codes)),
  }));

  merged.sort((a, b) => a.course - b.course);

  return merged;
};
