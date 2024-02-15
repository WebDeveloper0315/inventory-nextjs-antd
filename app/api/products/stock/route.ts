import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Stock from "@/models/stockModel";
connectDB();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const stock = await Stock.findOne({
      productCode: reqBody.code,
      pricePerUnit: reqBody.pricePerUnit,
    });

    if (stock) {
      console.log("stock-- ");
    } else {
      const newStock = new Stock({
        productCode: reqBody.code,
        pricePerUnit: reqBody.pricePerUnit,
        stocks: reqBody.units,
      });

      await newStock.save();
    }
    return NextResponse.json(
      { message: "Stock Record Saved Successfully", success: true },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
