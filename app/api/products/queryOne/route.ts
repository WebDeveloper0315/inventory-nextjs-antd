import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { requirePermission, errorResponse } from "@/helpers/auth";
import Stock from "@/models/stockModel";
import { Decimal, toDecimal, toNumber } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "query");
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("popCode");

    const filtersObject: any = {};
    if (productCode) {
      filtersObject.productCode = productCode;
    }

    // productCode is a plain String field (not a ref); no populate needed.
    const products = await Recording.find(filtersObject);
    // console.log(products);

    let totalBuyPrice = new Decimal(0);
    let totalSellPrice = new Decimal(0);
    let totalBuyUnits = 0;
    let totalSellUnits = 0;
    let totalSellTaxes = new Decimal(0);
    let totalBuyTaxes = new Decimal(0);
    let totalReturnUnits = 0;
    let totalReturnPrice = new Decimal(0);
    let totalTrashedUnits = 0;
    let totalTrashedPrice = new Decimal(0);
    let totalReturnedTaxes = new Decimal(0);

    products.forEach((product: any) => {
      const price = toDecimal(product.pricePerUnit);
      const units = Number(product.units) || 0;
      const taxRate = product.taxes ?? 0;
      const lineTotal = price.times(units);
      const lineTax = lineTotal.times(taxRate).div(100);
      if (product.mode === "buying") {
        totalBuyPrice = totalBuyPrice.plus(lineTotal);
        totalBuyUnits += units;
        totalBuyTaxes = totalBuyTaxes.plus(lineTax);
      } else if (product.mode === "selling") {
        totalSellPrice = totalSellPrice.plus(lineTotal);
        totalSellUnits += units;
        totalSellTaxes = totalSellTaxes.plus(lineTax);
      } else if (product.mode === "returning") {
        totalReturnUnits += units;
        totalReturnPrice = totalReturnPrice.plus(lineTotal);
        totalReturnedTaxes = totalReturnedTaxes.plus(lineTax);
      } else if (product.mode === "lost") {
        totalTrashedUnits += units;
        totalTrashedPrice = totalTrashedPrice.plus(lineTotal);
        totalReturnedTaxes = totalReturnedTaxes.plus(lineTax);
      }
    });

    // Guard divide-by-zero → averages are 0 instead of NaN.
    const avgBuyPrice = totalBuyUnits ? totalBuyPrice.div(totalBuyUnits) : new Decimal(0);
    const avgSellPrice = totalSellUnits ? totalSellPrice.div(totalSellUnits) : new Decimal(0);
    const avgBuyTaxes = totalBuyUnits ? totalBuyTaxes.div(totalBuyUnits) : new Decimal(0);

    const allData = await Stock.find({ productCode });
    const stockData = allData.map((oneData) => ({
      location: oneData.location,
      pricePerUnit: toNumber(oneData.pricePerUnit),
      stocks: oneData.stocks,
    }));

    const profitProduct = totalSellPrice
      .minus(totalBuyPrice)
      .minus(totalSellTaxes)
      .plus(totalBuyTaxes)
      .minus(totalReturnPrice)
      .minus(totalTrashedPrice)
      .plus(totalReturnedTaxes);

    const profitSale = new Decimal(
      totalSellUnits - totalReturnUnits - totalTrashedUnits
    )
      .times(avgSellPrice.minus(avgBuyPrice))
      .minus(totalSellTaxes)
      .plus(new Decimal(totalSellUnits - totalReturnUnits).times(avgBuyTaxes))
      .plus(totalReturnedTaxes)
      .minus(avgBuyPrice.times(totalTrashedUnits));

    const totalMoneyInTax = totalBuyTaxes
      .minus(totalSellTaxes)
      .plus(totalReturnedTaxes);

    return NextResponse.json(
      {
        unitsRemaining: totalBuyUnits - totalSellUnits + totalReturnUnits,
        unitsSold: totalSellUnits,
        unitsReturned: totalReturnUnits,
        unitsTrashed: totalTrashedUnits,
        averageBuyPrice: toNumber(avgBuyPrice),
        averageSellPrice: toNumber(avgSellPrice),
        profitProduct: toNumber(profitProduct),
        profitSale: toNumber(profitSale),
        totalMoneyInTax: toNumber(totalMoneyInTax),
        stockData,
      },
      { status: 201 }
    );
  
  } catch (error) {
    return errorResponse(error);
  }
}
