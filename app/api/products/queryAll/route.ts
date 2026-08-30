import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { requirePermission, errorResponse } from "@/helpers/auth";

import { calculateMetrics } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "query");
    await connectDB();

    const currentYear = new Date().getFullYear();

    const Vmonth = request.nextUrl.searchParams.get("month");
    // console.log("Month Value: ", Vmonth);

    const Vyear = request.nextUrl.searchParams.get("year");
    // console.log("Month Value: ", Vyear);

    const yearlyData: any = [];
    const yearlyDataForPdf = [];
    const filtersObject: any = {};
    let startOfLoop: number = 0;
    let endOfLoop: number = 0;
    let profitCodeValue: any = {};
    let profitMarketValue: any = {};

    let sellingCodeValue: any = {};
    let sellingMarketValue: any = {};

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

      // NOTE: productCode/market are plain String fields, not refs, so the
      // previous .populate() calls were no-ops (and throw in newer Mongoose).
      const graphData = await Recording.find(filtersObject);

      // console.log("queryAll/route.ts  ", graphData);

      const metrics = calculateMetrics(graphData);
      // console.log('metrics   ', metrics);

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

      const sortedTrashedUnitsValue = Object.fromEntries(
        Object.entries(metrics.totTrashedUnits).sort(
          ([, a], [, b]) => (b as any) - (a as any)
        )
      );

      // console.log("sorted sell units: ", sortedTotSellUnits);

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
          {
            key: `${i}08`,
            name: "Items Trashed",
            value: metrics.allTrashedUnits,
            children: Object.entries(sortedTrashedUnitsValue).map(
              ([vKey, priceValue], index) => ({
                key: `${i}08${index + 1}`,
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
      sellingCodeValue = metrics.sellingCode;
      sellingMarketValue = metrics.sellingMarket;

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
          {
            name: "Items Trashed",
            value: metrics.allTrashedUnits,
            children: Object.entries(sortedTrashedUnitsValue).map(
              ([vKey, priceValue], index) => ({
                name: vKey,
                value: priceValue,
              })
            ),
          },
        ],
      };
      yearlyDataForPdf.push(monthlyDataForPDF);
    }
    // console.log(yearlyData);
    // console.log('queryAll/route.ts  ')

    return NextResponse.json(
      {
        tableData: yearlyData,
        tableDataForPdf: yearlyDataForPdf,
        profitCode: profitCodeValue,
        profitMarket: profitMarketValue,
        sellingCode: sellingCodeValue,
        sellingMarket: sellingMarketValue,
      },
      {
        status: 201,
      }
    );

    

    // return NextResponse.json(graphData)
  } catch (error) {
    return errorResponse(error);
  }
}
