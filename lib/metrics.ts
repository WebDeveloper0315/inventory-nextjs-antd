import { Decimal, toDecimal, toNumber, type MoneyInput } from "@/lib/money";

/**
 * Pure financial aggregation for the reporting endpoints. Money values are
 * summed with decimal.js (exact) and returned as plain numbers for JSON.
 *
 * The formulas mirror the original implementation exactly — only the
 * arithmetic was moved from floating-point to Decimal, and divide-by-zero is
 * guarded so averages are 0 instead of NaN.
 */

export interface RecordingItem {
  productCode: string;
  mode: string;
  pricePerUnit: MoneyInput;
  units: number;
  market?: string;
  taxes?: number;
}

type NumDict = Record<string, number>;
type DecDict = Record<string, Decimal>;

const zero = () => new Decimal(0);

function addDec(dict: DecDict, key: string, value: Decimal) {
  dict[key] = (dict[key] ?? zero()).plus(value);
}
function addNum(dict: NumDict, key: string, value: number) {
  dict[key] = (dict[key] ?? 0) + value;
}
function toNumDict(dict: DecDict, dp = 2): NumDict {
  const out: NumDict = {};
  for (const k in dict) out[k] = Number(dict[k].toFixed(dp));
  return out;
}

export function calculateMetrics(graphData: RecordingItem[]) {
  const totBuyUnits: NumDict = {};
  const totSellUnits: NumDict = {};
  const totReturnedUnits: NumDict = {};
  const totTrashedUnits: NumDict = {};
  const sellingCode: NumDict = {};
  const sellingMarket: NumDict = {};

  const totBuyPrice: DecDict = {};
  const totSellPrice: DecDict = {};
  const totBuyTaxes: DecDict = {};
  const totSellTaxes: DecDict = {};
  const totReturnedPrice: DecDict = {};
  const totTrashedPrice: DecDict = {};
  const totReturnedTaxes: DecDict = {};

  let marketString: any = {};

  for (const item of graphData) {
    const { productCode, mode, units, market, taxes } = item;
    const price = toDecimal(item.pricePerUnit);
    const u = Number(units) || 0;
    const taxRate = taxes === undefined || taxes === null ? undefined : taxes;
    const lineTotal = price.times(u);
    const lineTax = (rate: number | undefined) =>
      rate === undefined ? zero() : lineTotal.times(rate).div(100);

    marketString = market;

    // Ensure unit dicts have an entry (mirrors original init behaviour).
    if (!(productCode in totBuyUnits)) totBuyUnits[productCode] = 0;
    if (!(productCode in totSellUnits)) totSellUnits[productCode] = 0;
    if (!(productCode in totReturnedUnits)) totReturnedUnits[productCode] = 0;
    if (!(productCode in totTrashedUnits)) totTrashedUnits[productCode] = 0;
    if (!(productCode in sellingCode)) sellingCode[productCode] = 0;
    if (market !== undefined && !(market in sellingMarket)) {
      sellingMarket[market] = 0;
    }

    if (mode === "buying") {
      addDec(totBuyPrice, productCode, lineTotal);
      addNum(totBuyUnits, productCode, u);
      addDec(totBuyTaxes, productCode, lineTax(taxRate));
    } else if (mode === "selling") {
      addDec(totSellPrice, productCode, lineTotal);
      addNum(totSellUnits, productCode, u);
      addDec(totSellTaxes, productCode, lineTax(taxRate));
      addNum(sellingCode, productCode, u);
      if (market !== undefined) addNum(sellingMarket, market, u);
    } else if (mode === "returning") {
      addDec(totReturnedPrice, productCode, lineTotal);
      addNum(totReturnedUnits, productCode, u);
      addDec(totReturnedTaxes, productCode, lineTax(taxRate));
    } else if (mode === "lost") {
      addDec(totTrashedPrice, productCode, lineTotal);
      addNum(totTrashedUnits, productCode, u);
      addDec(totReturnedTaxes, productCode, lineTax(taxRate));
    }
  }

  const avgBuyPrice: DecDict = {};
  const avgBuyTaxes: DecDict = {};
  let allBuyPrice = zero();
  let allBuyTaxes = zero();
  for (const pc in totBuyPrice) {
    const units = totBuyUnits[pc] || 0;
    avgBuyPrice[pc] = units ? totBuyPrice[pc].div(units) : zero();
    avgBuyTaxes[pc] = units ? (totBuyTaxes[pc] ?? zero()).div(units) : zero();
    allBuyPrice = allBuyPrice.plus(totBuyPrice[pc]);
    allBuyTaxes = allBuyTaxes.plus(totBuyTaxes[pc] ?? zero());
  }

  const avgSellPrice: DecDict = {};
  let allSellPrice = zero();
  let allSellUnits = 0;
  let allSellTaxes = zero();
  for (const pc in totSellPrice) {
    const units = totSellUnits[pc] || 0;
    avgSellPrice[pc] = units ? totSellPrice[pc].div(units) : zero();
    allSellPrice = allSellPrice.plus(totSellPrice[pc]);
    allSellUnits += units;
    allSellTaxes = allSellTaxes.plus(totSellTaxes[pc] ?? zero());
  }

  let allReturnedUnits = 0;
  for (const pc in totReturnedUnits) allReturnedUnits += totReturnedUnits[pc];
  let allTrashedUnits = 0;
  for (const pc in totTrashedUnits) allTrashedUnits += totTrashedUnits[pc];

  const profitCode: DecDict = {};
  let allProfit = zero();
  for (const pc in totBuyPrice) {
    profitCode[pc] = zero();
    if (totSellPrice[pc]) {
      profitCode[pc] = totSellPrice[pc]
        .minus(totBuyPrice[pc])
        .minus(totSellTaxes[pc] ?? zero())
        .plus(totBuyTaxes[pc] ?? zero())
        .minus(totReturnedPrice[pc] ?? zero())
        .minus(totTrashedPrice[pc] ?? zero())
        .plus(totReturnedTaxes[pc] ?? zero());
      allProfit = allProfit.plus(profitCode[pc]);
    }
  }

  return {
    totBuyUnits,
    totBuyPrice: toNumDict(totBuyPrice),
    totSellUnits,
    totSellPrice: toNumDict(totSellPrice),
    totBuyTaxes: toNumDict(totBuyTaxes),
    totSellTaxes: toNumDict(totSellTaxes),
    totReturnedUnits,
    totTrashedUnits,
    avgBuyPrice: toNumDict(avgBuyPrice),
    avgBuyTaxes: toNumDict(avgBuyTaxes),
    allBuyPrice: toNumber(allBuyPrice),
    allBuyTaxes: toNumber(allBuyTaxes),
    avgSellPrice: toNumDict(avgSellPrice),
    allSellPrice: toNumber(allSellPrice),
    allSellUnits,
    allSellTaxes: toNumber(allSellTaxes),
    allReturnedUnits,
    allTrashedUnits,
    profitCode: toNumDict(profitCode),
    profitMarket: {} as NumDict,
    allProfit: toNumber(allProfit),
    marketString,
    sellingCode,
    sellingMarket,
  };
}
