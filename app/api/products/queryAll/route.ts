import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { validateJWT } from "@/helpers/validateJWT";

connectDB();

function calculateMetrics(graphData: any) {
  const totBuyUnits: any = {};
  const totBuyPrice: any = {};
  const totSellUnits: any = {};
  const totSellPrice: any = {};
  const totBuyTaxes: any = {};
  const totSellTaxes: any = {};
  const totReturnedUnits: any = {};
  graphData.forEach(
    (item: {
      productCode: any;
      mode: any;
      pricePerUnit: any;
      units: any;
      market: any;
      taxes: any;
    }) => {
      const { productCode, mode, pricePerUnit, units, market, taxes } = item;
      console.log(market);
      if (mode === "buying") {
        if (!totBuyPrice[productCode])
          totBuyPrice[productCode] = pricePerUnit * units;
        else totBuyPrice[productCode] += pricePerUnit * units;

        if (!totBuyUnits[productCode]) totBuyUnits[productCode] = units;
        else totBuyUnits[productCode] += units;

        if (!totBuyTaxes[productCode]) {
          if (taxes !== undefined) {
            totBuyTaxes[productCode] = (taxes * pricePerUnit * units) / 100;
          }
        } else {
          if (taxes !== undefined) {
            totBuyTaxes[productCode] += (taxes * pricePerUnit * units) / 100;
          }
        }
      } else if (mode === "selling") {
        if (!totSellPrice[productCode])
          totSellPrice[productCode] = pricePerUnit * units;
        else totSellPrice[productCode] += pricePerUnit * units;

        if (!totSellUnits[productCode]) totSellUnits[productCode] = units;
        else totSellUnits[productCode] += units;

        if (!totSellTaxes[productCode]) {
          if (taxes !== undefined) {
            totSellTaxes[productCode] = (taxes * pricePerUnit * units) / 100;
          }
        } else {
          if (taxes !== undefined) {
            totSellTaxes[productCode] += (taxes * pricePerUnit * units) / 100;
          }
        }
      } else if (mode === "returning") {
        totSellPrice[productCode] -= pricePerUnit * units;
        totSellUnits[productCode] -= units;

        if (!totReturnedUnits[productCode])
          totReturnedUnits[productCode] = units;
        else totReturnedUnits[productCode] += units;
      }
    }
  );

  console.log("totSellTaxes", totSellTaxes);
  const avgBuyPrice: any = {};
  const avgBuyTaxes: any = {};
  let allBuyPrice: any = 0;
  // let allBuyUnits: any = 0;
  let allBuyTaxes: any = 0;
  for (const productCode in totBuyPrice) {
    avgBuyPrice[productCode] =
      totBuyPrice[productCode] / totBuyUnits[productCode];
    avgBuyTaxes[productCode] =
      totBuyTaxes[productCode] / totBuyUnits[productCode];
    allBuyPrice += totBuyPrice[productCode];
    // allBuyUnits += totBuyUnits[productCode];
    allBuyTaxes += totBuyTaxes[productCode];
  }

  console.log(allBuyTaxes);

  const avgSellPrice: any = {};
  let allSellPrice: any = 0;
  let allSellUnits: any = 0;
  let allSellTaxes: any = 0;

  for (const productCode in totSellPrice) {
    avgSellPrice[productCode] =
      totSellPrice[productCode] / totSellUnits[productCode];
    allSellPrice += totSellPrice[productCode];
    allSellUnits += totSellUnits[productCode];
    allSellTaxes += totSellTaxes[productCode];
  }

  let allReturnedUnits: any = 0;
  for (const productCode in totReturnedUnits) {
    allReturnedUnits += totReturnedUnits[productCode];
  }

  // console.log(avgSellPrice);

  const profitCode: any = {};
  const profitMarket: any = {};
  let allProfit: any = 0;
  graphData.forEach(
    (item: {
      productCode: any;
      mode: any;
      pricePerUnit: any;
      units: any;
      market: any;
      taxes: any;
    }) => {
      const { productCode, mode, pricePerUnit, units, market, taxes } = item;
      if (mode === "selling") {
        if (taxes !== undefined) {
          const profit =
            ((1 - taxes / 100) * pricePerUnit -
              avgBuyPrice[productCode] +
              avgBuyTaxes[productCode]) *
            units;
          if (!profitCode[productCode]) profitCode[productCode] = profit;
          else profitCode[productCode] += profit;
          allProfit += profit;

          if (market !== undefined) {
            if (!profitMarket[market]) profitMarket[market] = profit;
            else profitMarket[market] += profit;
          }
        }
      } else if (mode === "returning") {
        const profit = (pricePerUnit - avgBuyPrice[productCode]) * units;
        profitCode[productCode] -= profit;
        if (market !== undefined) {
          profitMarket[market] -= profit;
        }
        allProfit -= profit;
      }
    }
  );

  return {
    totBuyUnits,
    totBuyPrice,
    totSellUnits,
    totSellPrice,
    totBuyTaxes,
    totSellTaxes,
    totReturnedUnits,
    avgBuyPrice,
    avgBuyTaxes,
    allBuyPrice,
    allBuyTaxes,
    avgSellPrice,
    allSellPrice,
    allSellUnits,
    allSellTaxes,
    allReturnedUnits,
    profitCode,
    profitMarket,
    allProfit,
  };
}

export async function GET(request: NextRequest) {
  try {
    validateJWT(request);

    const currentYear = new Date().getFullYear();

    const Vmonth = request.nextUrl.searchParams.get("month");
    console.log("Month Value: ", Vmonth);

    const Vyear = request.nextUrl.searchParams.get("year");
    console.log("Month Value: ", Vyear);

    const yearlyData: any = [];
    const yearlyDataForPdf = [];
    const filtersObject: any = {};
    let startOfLoop: number = 0;
    let endOfLoop: number = 0;
    let profitCodeValue: any = {};
    let profitMarketValue: any = {};

    if (Vmonth) {
      startOfLoop = 0;
      endOfLoop = parseInt(Vmonth);
    } else if (Vyear) {
      startOfLoop = parseInt(Vyear) - 3;
      endOfLoop = parseInt(Vyear) + 1;
    }

    for (let i = startOfLoop; i < endOfLoop; i++) {
      if (Vmonth) {
        // Assuming Vmonth is in the format MM (e.g., 01 for January)
        const startOfMonth = new Date(currentYear, i, 1);
        const endOfMonth = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
        filtersObject.createdAt = {
          $gte: startOfMonth,
          $lt: endOfMonth,
        };
      } else if (Vyear) {
        // Assuming Vyear is in the format YYYY (e.g., 2022)
        const startOfYear = new Date(i, 0, 1);
        const endOfYear = new Date(i, 11, 31, 23, 59, 59, 999);
        filtersObject.createdAt = {
          $gte: startOfYear,
          $lt: endOfYear,
        };
      }

      const graphData = await Recording.find(filtersObject)
        .populate("productCode")
        .populate("market");

      // console.log("queryAll/route.ts  ", graphData);

      const metrics = calculateMetrics(graphData);
      console.log(metrics);

      const sortedTotSellUnits = Object.fromEntries(
        Object.entries(metrics.totSellUnits).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedTotSellPrice = Object.fromEntries(
        Object.entries(metrics.totSellPrice).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedTotBuyPrice = Object.fromEntries(
        Object.entries(metrics.totBuyPrice).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedProfitCode = Object.fromEntries(
        Object.entries(metrics.profitCode).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedSellTaxesValue = Object.fromEntries(
        Object.entries(metrics.totSellTaxes).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedBuyTaxesValue = Object.fromEntries(
        Object.entries(metrics.totBuyTaxes).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      const sortedReturnedUnitsValue = Object.fromEntries(
        Object.entries(metrics.totReturnedUnits).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );
      console.log("sorted sell units: ", sortedTotSellUnits);

      const monthlyData = {
        key: i,
        name: `${
          Vmonth
            ? new Date(currentYear, i, 1).toLocaleString("default", {
                month: "long",
              })
            : "Year " + i
        }`,
        value: "",
        children: [
          {
            key: `${i}01`,
            name: "Total Profit",
            value: metrics.allProfit,
            children: Object.entries(sortedProfitCode).map(
              ([vKey, priceValue], index) => ({
                key: `${i}01${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}02`,
            name: "Total Units Sold",
            value: metrics.allSellUnits,
            children: Object.entries(sortedTotSellUnits).map(
              ([vKey, priceValue], index) => ({
                key: `${i}02${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}03`,
            name: "Total Sell Price",
            value: metrics.allSellPrice,
            children: Object.entries(sortedTotSellPrice).map(
              ([vKey, priceValue], index) => ({
                key: `${i}03${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}04`,
            name: "Total Buy Price",
            value: metrics.allBuyPrice,
            children: Object.entries(sortedTotBuyPrice).map(
              ([vKey, priceValue], index) => ({
                key: `${i}04${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}05`,
            name: "Taxes with Buying",
            value: metrics.allBuyTaxes,
            children: Object.entries(sortedBuyTaxesValue).map(
              ([vKey, priceValue], index) => ({
                key: `${i}05${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}06`,
            name: "Taxes with Selling",
            value: metrics.allSellTaxes,
            children: Object.entries(sortedSellTaxesValue).map(
              ([vKey, priceValue], index) => ({
                key: `${i}06${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            key: `${i}07`,
            name: "Items Returned",
            value: metrics.allReturnedUnits,
            children: Object.entries(sortedReturnedUnitsValue).map(
              ([vKey, priceValue], index) => ({
                key: `${i}07${index + 1}`,
                name: vKey,
                value: priceValue,
              })
            ),
          },
        ],
      };

      yearlyData.push(monthlyData);
      profitCodeValue = metrics.profitCode;
      profitMarketValue = metrics.profitMarket;


      const monthlyDataForPDF = {
        name: `${
          Vmonth
            ? new Date(currentYear, i, 1).toLocaleString("default", {
                month: "long",
              })
            : "Year " + i
        }`,
        value: "",
        children: [
          {
            name: "Total Profit",
            value: metrics.allProfit,
            children: Object.entries(sortedProfitCode).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Total Units Sold",
            value: metrics.allSellUnits,
            children: Object.entries(sortedTotSellUnits).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Total Sell Price",
            value: metrics.allSellPrice,
            children: Object.entries(sortedTotSellPrice).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Total Buy Price",
            value: metrics.allBuyPrice,
            children: Object.entries(sortedTotBuyPrice).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Taxes with Buying",
            value: metrics.allBuyTaxes,
            children: Object.entries(sortedBuyTaxesValue).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Taxes with Selling",
            value: metrics.allSellTaxes,
            children: Object.entries(sortedSellTaxesValue).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
          {
            name: "Items Returned",
            value: metrics.allReturnedUnits,
            children: Object.entries(sortedReturnedUnitsValue).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
        ],
      };
      yearlyDataForPdf.push(monthlyDataForPDF)
    }
    console.log(yearlyData);

    return NextResponse.json(
      {
        tableData: yearlyData,
        tableDataForPdf: yearlyDataForPdf,
        profitCode: profitCodeValue,
        profitMarket: profitMarketValue,
      },
      {
        status: 201,
      }
    );

    // console.log('queryAll/route.ts  ',products)

    // return NextResponse.json(graphData)
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something Went Wrong" },
      { status: 500 }
    );
  }
}
