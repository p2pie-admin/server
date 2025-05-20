import console from "console";
import { getData, getObject } from "./redis";
import { IPopularDirs } from "./types/pms";
import { IAllDirtyRates, IRate } from "./types/rates";
import { getCleanDirRates } from "./helper";

const findBestRateByDir = async (dir: string, fiatIndex: number) => {
  const cleanDirRates = await getCleanDirRates(dir);

  if (!cleanDirRates || Object.keys(cleanDirRates).length === 0) return;

  const [exchangerId, rate] = [...Object.entries(cleanDirRates)].sort(
    (r1, r2) => r1[1].course - r2[1].course
  )[0];
  const best = {
    exchangerId,
    course: fiatIndex ? 1 / rate.course : rate.course,
    fiat: dir.split("_")[fiatIndex],
  };

  return best;
};

export const getSimilarRates = async (dirs: string[]) => {
  const results = await Promise.all(
    dirs.map((dir) => findBestCourseByDir(dir))
  );
  return results;
};

const findBestCourseByDir = async (dir: string) => {
  const cleanDirRates = await getCleanDirRates(dir);

  if (!cleanDirRates || Object.keys(cleanDirRates).length === 0) return;
  const [_, rate] = [...Object.entries(cleanDirRates)].sort(
    (r1, r2) => r1[1].course - r2[1].course
  )[0];
  return [rate.course, Object.keys(cleanDirRates).length];
};

export const getPopularRates = async () => {
  const popularDirs = (await getData("popular_dirs")) as IPopularDirs;

  const res = await Object.entries(popularDirs).reduce(
    async (accPromise, [cryptoCode, sides]) => {
      const acc = await accPromise;
      const [buyCourses, sellCourses] = await Promise.all([
        Promise.all(sides.buy.map((dir) => findBestRateByDir(dir, 0))),
        Promise.all(sides.sell.map((dir) => findBestRateByDir(dir, 1))),
      ]);

      return { ...acc, [cryptoCode]: { buy: buyCourses, sell: sellCourses } };
    },
    Promise.resolve({})
  );

  //console.log(JSON.stringify(res, undefined, 4));
  return res;
};
