import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { validateJWT } from "@/helpers/validateJWT";

connectDB();

export async function GET(request: NextRequest) {
  try {
    validateJWT(request);
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("popCode");

    const filtersObject: any = {};
    if (productCode) {
      filtersObject.productCode = productCode;
    }

    const products =
      await Recording.find(filtersObject).populate("productCode");
    console.log(products);

    let totalBuyPrice = 0;
    let totalSellPrice = 0;
    let totalBuyUnits = 0;
    let totalSellUnits = 0;
    let totalTaxes = 0;

    products.forEach((product: any) => {
      if (product.mode === "buying") {
        totalBuyPrice += product.pricePerUnit * product.units;
        totalBuyUnits += product.units;
      } else if (product.mode === "selling") {
        totalSellPrice += product.pricePerUnit * product.units;
        totalSellUnits += product.units;
        totalTaxes += (product.pricePerUnit * product.units * product.taxes) / 100;
      } else if ( product.mode === "returning") {
        totalSellUnits -= product.units;
        totalSellPrice -= product.pricePerUnit * product.units;
      }
    });

    const avgBuyPrice = totalBuyPrice / totalBuyUnits;
    const avgSellPrice = totalSellPrice / totalSellUnits;

    console.log("Average Buy Price:", avgBuyPrice);
    console.log("Average Sell Price:", avgSellPrice);
    return NextResponse.json(
      {
        unitsRemaining: totalBuyUnits - totalSellUnits,
        unitsSold: totalSellUnits,
        averageBuyPrice: avgBuyPrice,
        averageSellPrice: avgSellPrice,
        profit: totalSellUnits * (avgSellPrice - avgBuyPrice) - totalTaxes,
        averageMoneyInTax: totalTaxes / totalSellUnits,
        
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something Went Wrong" },
      { status: 500 }
    );
  }
}
