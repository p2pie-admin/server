import { getCleanDirRates, mylog } from "./helper";
import { getObject } from "./redis";
import { IAllRatesID, IRatesID } from "./types/rates";
const getPossiblePairs = async ({
  code,
  side,
}: {
  code: string;
  side: "give" | "get";
}) => {
  const allRatesID = (await getObject("allRatesID")) as IAllRatesID;
  if (!allRatesID) {
    mylog("[dirsExistHandler] No dirs exist yet!", "warning");
    return;
  }

  const possiblePairs: Record<string, string[]> = {};

  for (const dir in allRatesID) {
    const { all } = allRatesID[dir];
    if (!all || all.length < 3) continue;

    const [leftPm, rightPm] = dir.split("_");
    if (!leftPm || !rightPm) continue;

    // Filter by side + code if provided

    if (side === "give" && leftPm !== code) continue;
    if (side === "get" && rightPm !== code) continue;

    if (side === "give") {
      if (!possiblePairs[leftPm]) possiblePairs[leftPm] = [];
      possiblePairs[leftPm].push(rightPm);
    } else {
      if (!possiblePairs[rightPm]) possiblePairs[rightPm] = [];
      possiblePairs[rightPm].push(leftPm);
    }
  }

  // If code was specified, just return the array for that code
  if (code) {
    return possiblePairs[code] ?? [];
  }

  return possiblePairs;
};

export default getPossiblePairs;
