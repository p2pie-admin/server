import { getCleanDirRates, mylog } from "./helper";
import { getObject, getData, setData } from "./redis";
import { IAllRatesID, IRatesID } from "./types/rates";

const getPossiblePairs = async () => {
  const allRatesID = (await getObject("allRatesID")) as IAllRatesID;

  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];
  if (!allRatesID || !allPmCodesThatExist) {
    mylog("[dirsExistHandler] No dirs exist yet!", "warning");
    return;
  }

  const possibleEverDirs = allPmCodesThatExist.reduce(
    (res: string[], leftCode) => [
      ...res,
      ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  ); // getting all possible pairs [A]_[B]

  const possiblePairs: { [key: string]: string[] } = {};

  for (const dir of possibleEverDirs) {
    const directionRates = allRatesID?.[dir]?.all;
    if (!directionRates) continue;
    // возможно такое, что при билде фронта курсов нет, а потом он появится
    // и потом в селекторе его можно будет выбрать, а при билде его не было значит 404
    // поэтому сделаем хотя бы 2 курса чтобы было для минимизации таких кейсов
    if (!directionRates || Object.keys(directionRates).length < 3) continue;

    const [leftPm, rightPm] = dir.split("_");
    if (!leftPm || !rightPm) continue; // Handle malformed strings

    possiblePairs[leftPm] = possiblePairs[leftPm]
      ? [...possiblePairs[leftPm], rightPm]
      : [rightPm];
  }

  return possiblePairs;
};

export default getPossiblePairs;
