import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import Stock from "@/models/stockModel";
import Location from "@/models/locationModel";
import { requirePermission, errorResponse } from "@/helpers/auth";
import { parseOrThrow, recordingSchema } from "@/helpers/validate";
import { toDecimal, toDecimal128 } from "@/lib/money";
import { nowIso } from "@/lib/dates";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buying = searchParams.get("buying");
    const selling = searchParams.get("selling");
    const returning = searchParams.get("returning");

    // The required permission depends on the operation: buying is part of the
    // New Product flow, selling is Sold, and store/bin returns are Item Return.
    const permission = buying
      ? "newProduct"
      : selling
        ? "sold"
        : "returning";
    await requirePermission(request, permission);
    await connectDB();

    const reqBody = await request.json();
    // Validate shape (throws 400 on invalid); keep using reqBody as-is after.
    parseOrThrow(recordingSchema, reqBody);

    const locationString = reqBody.location; // Assuming this is the locations string from reqBody
    let locationInfo: string = locationString;
    if(selling){
      const openingParenIndex = locationString.indexOf("(");
      locationInfo = locationString.substring(0, openingParenIndex);
    }
    
    // console.log("locationInfo", locationInfo);

    let modeString = "";
    let tax = 0;
    tax = reqBody.taxes;
    if (buying) {
      modeString = "buying";
      // tax = reqBody.taxes;
    } else if (selling) {
      modeString = "selling";
      // tax = reqBody.taxes;
    } else if (returning === 'store') {
      modeString = "returning";
    } else if (returning === 'bin') {
      modeString = "lost";
    }

    // const stock = await Stock.findOne({ productCode: reqBody.code,  pricePerUnit: reqBody.pricePerUnit})
    const stock = await Stock.findOne({
      productCode: reqBody.code,
      location: locationInfo,
    });

    if (stock) {
      if (buying) {
        // Weighted-average cost, computed exactly with Decimal and stored as
        // Decimal128.
        const newUnits = Number(reqBody.units) || 0;
        const totalUnits = stock.stocks + newUnits;
        if (totalUnits > 0) {
          const weighted = toDecimal(stock.pricePerUnit)
            .times(stock.stocks)
            .plus(toDecimal(reqBody.pricePerUnit).times(newUnits))
            .div(totalUnits);
          stock.pricePerUnit = toDecimal128(weighted);
        }
        stock.stocks += newUnits;
      } else if (selling) {
        if (stock.stocks >= Number(reqBody.units))
          stock.stocks -= Number(reqBody.units);
        else
          return NextResponse.json(
            { message: "Stock not Enough!", success: false },
            { status: 400 }
          );
      } else if (returning === 'store') {
        stock.stocks += Number(reqBody.units);
      }
      await stock.save();
    } else {
      if(modeString !== 'lost'){
        const newStock = new Stock({
          productCode: reqBody.code,
          pricePerUnit: toDecimal128(reqBody.pricePerUnit),
          stocks: reqBody.units,
          location: locationInfo,
        });
        await newStock.save();
      }
      
    }

    const newRecording = new Recording({
      productCode: reqBody.code,
      mode: modeString,
      pricePerUnit: toDecimal128(reqBody.pricePerUnit),
      units: reqBody.units,
      market: reqBody.market,
      location: locationInfo,
      taxes: tax,
      createdTime: nowIso(),
    });

    await newRecording.save();
    
    

    const locationQuery = await Location.findOne({location: locationInfo});
    
    if(!locationQuery){
      const newLocation = new Location({
        location: locationInfo,
        description: "",
      });
      await newLocation.save();
    }

    return NextResponse.json(
      { message: "Record Saved Successfully", success: true },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

