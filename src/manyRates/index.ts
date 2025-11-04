import { getCleanDirRates } from "../helper";
import { getData } from "../redis";
import { IPopularDirs } from "../types/pms";

const findBestRateByDir = async (dir: string, fiatIndex: number) => {
  const cleanDirRates = await getCleanDirRates(dir, "part");

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

  if (!cleanDirRates.length) return;
  const [bestRate] = [...cleanDirRates].sort(
    (rateA, rateB) => rateA.course - rateB.course
  );
  if (!bestRate) return;
  return [bestRate.course, cleanDirRates.length];
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
