import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/productModel";
import { validateJWT } from "@/helpers/validateJWT";
import Stock from "@/models/stockModel";
import Recording from "@/models/recordingModel";
import Location from "@/models/locationModel";

connectDB();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    // console.log(reqBody)
    // check if user already exists
    const product = await Product.findOne({ productCode: reqBody.code });
    if (product) {
      throw new Error("Product already exists");
    }

    // create product
    const newProduct = new Product({
      productCode: reqBody.code,
      productImage: reqBody.imagePath,
      disposableUnits: reqBody.units, 
      pricePerUnit: reqBody.pricePerUnit,
      location: reqBody.location,
      market: reqBody.market,
    });

    await newProduct.save();

    const stock = await Stock.findOne({ productCode: reqBody.code, location: reqBody.location });

    if (stock) {
      stock.stocks += Number(reqBody.units);
      await stock.save();
    } else {
      const newStock = new Stock({
        productCode: reqBody.code,
        pricePerUnit: reqBody.pricePerUnit,
        stocks: reqBody.units,
        location: reqBody.location,
      });

      await newStock.save();
    }

    const newRecording = new Recording({
      productCode: reqBody.code,
      mode: "buying",
      pricePerUnit: reqBody.pricePerUnit,
      units: reqBody.units,
      market: reqBody.market,
      taxes: reqBody.taxes,
      location: reqBody.location,
    });

    await newRecording.save();

    const locationQuery = await Location.findOne({location: reqBody.location});
    
    if(!locationQuery){
      const newLocation = new Location({
        location: reqBody.location,
        description: "",
      });
      await newLocation.save();
    }

    return NextResponse.json(
      { message: "Product Created Successfully", success: true },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await validateJWT(request);
    const { searchParams } = new URL(request.url);

    const productCode = searchParams.get("productCode");

    const product = await Product.findOne({ productCode });
    if (product) {
      return NextResponse.json(
        { message: "Selected Product exists", success: true },
        { status: 201 }
      );
    }
    return NextResponse.json(
      { message: "Selected Product does not exist", success: true },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
