import { getCleanDirRates } from "../helper";
import { getData } from "../redis";
import { IRate } from "../types/rates";
import { IPopularDirs } from "../types/pms";

const normalizeCityRate = (entry: unknown): IRate | null => {
  if (typeof entry === "object" && entry !== null) {
    const normalized = entry as { rate?: unknown };
    if (normalized.rate && typeof normalized.rate === "object") {
      return normalized.rate as IRate;
    }
    return normalized as IRate;
  }
  return null;
};

const isCashDir = (dir: string) =>
  dir
    .split("_")
    .some((part) => typeof part === "string" && part.toUpperCase().includes("CASH"));

const withCityForCashDir = (rates: IRate[], dir: string, city?: string): IRate[] => {
  if (!city || !isCashDir(dir)) return rates;

  const cityKey = city.toLowerCase();

  return rates.reduce((acc: IRate[], rate) => {
    const cityRate = normalizeCityRate(rate.cityRates?.[cityKey]);
    if (!cityRate) return acc;

    acc.push({
      ...rate,
      ...cityRate,
      cityRates: rate.cityRates ? { [cityKey]: rate.cityRates[cityKey] } : undefined,
    });

    return acc;
  }, []);
};

const findBestRateByDir = async (
  dir: string,
  fiatIndex: number,
  city?: string
) => {
  const cleanDirRates = withCityForCashDir(await getCleanDirRates(dir), dir, city);

  if (!cleanDirRates.length) return;

  const [bestRate] = [...cleanDirRates].sort(
    (rateA, rateB) => rateA.course - rateB.course
  );

  if (!bestRate) return;

  const course =
    fiatIndex && bestRate.course !== 0 ? 1 / bestRate.course : bestRate.course;

  const best = {
    exchangerId: bestRate.exchangerId,
    course,
    fiat: dir.split("_")[fiatIndex],
    exchangers: cleanDirRates.length,
  };

  return best;
};

const countUniqueExchangersByDirs = async (dirs: string[], city?: string) => {
  const ratesByDir = await Promise.all(
    dirs.map(async (dir) =>
      withCityForCashDir(await getCleanDirRates(dir), dir, city)
    )
  );

  const unique = new Set<string>();

  for (const rates of ratesByDir) {
    for (const rate of rates) {
      if (rate?.exchangerId === undefined || rate.exchangerId === null) continue;
      unique.add(String(rate.exchangerId));
    }
  }

  return unique.size;
};

export const getSimilarRates = async (dirs: string[], city?: string) => {
  const results = await Promise.all(
    dirs.map(async (dir) => {
      try {
        return await findBestCourseByDir(dir, city);
      } catch {
        return null;
      }
    })
  );
  return results;
};

const findBestCourseByDir = async (dir: string, city?: string) => {
  const cleanDirRates = withCityForCashDir(await getCleanDirRates(dir), dir, city);

  if (!cleanDirRates.length) return null;
  const [bestRate] = [...cleanDirRates].sort(
    (rateA, rateB) => rateA.course - rateB.course
  );
  if (!bestRate) return null;
  return [bestRate.course, cleanDirRates.length];
};

export const getPopularRates = async (city?: string) => {
  const popularDirs = (await getData("popular_dirs")) as IPopularDirs;

  const res = await Object.entries(popularDirs).reduce(
    async (accPromise, [cryptoCode, sides]) => {
      const acc = await accPromise;
      const [buyCourses, sellCourses, total] = await Promise.all([
        Promise.all(sides.buy.map((dir) => findBestRateByDir(dir, 0, city))),
        Promise.all(sides.sell.map((dir) => findBestRateByDir(dir, 1, city))),
        countUniqueExchangersByDirs([...sides.buy, ...sides.sell], city),
      ]);

      return {
        ...acc,
        [cryptoCode]: { buy: buyCourses, sell: sellCourses, total },
      };
    },
    Promise.resolve({})
  );

  //console.log(JSON.stringify(res, undefined, 4));
  return res;
};
