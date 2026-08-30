import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Stock from "@/models/stockModel";
import { requirePermission, errorResponse } from "@/helpers/auth";
import { toDecimal128 } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(request, "newProduct");
    await connectDB();
    const reqBody = await request.json();
    const price = toDecimal128(reqBody.pricePerUnit);
    const stock = await Stock.findOne({
      productCode: reqBody.code,
      pricePerUnit: price,
    });

    if (!stock) {
      const newStock = new Stock({
        productCode: reqBody.code,
        pricePerUnit: price,
        stocks: reqBody.units,
      });

      await newStock.save();
    }
    return NextResponse.json(
      { message: "Stock Record Saved Successfully", success: true },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
