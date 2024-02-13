import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import Stock from "@/models/stockModel";
import Location from "@/models/locationModel";
import { validateJWT } from "@/helpers/validateJWT";
connectDB();

export async function POST(request: NextRequest) {
  try {
    await validateJWT(request);

    const { searchParams } = new URL(request.url);
    // console.log('search parameter', searchParams)
    const buying = searchParams.get("buying");
    // console.log("buying parameter ", buying);

    const selling = searchParams.get("selling");
    // console.log("selling parameter ", selling);

    const returning = searchParams.get("returning");
    // console.log("returning parameter ", returning);

    const reqBody = await request.json();
    // console.log("recording/route.ts", reqBody);

    const locationString = reqBody.location; // Assuming this is the locations string from reqBody
    let locationInfo: string = locationString;
    if(selling){
      const openingParenIndex = locationString.indexOf("(");
      locationInfo = locationString.substring(0, openingParenIndex);
    }
    
    // console.log("locationInfo", locationInfo);

    let modeString = "";
    let tax = 0;
    if (buying) {
      modeString = "buying";
      tax = reqBody.taxes;
    } else if (selling) {
      modeString = "selling";
      tax = reqBody.taxes;
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
        stock.pricePerUnit =
          (stock.pricePerUnit * stock.stocks +
            Number(reqBody.pricePerUnit) * Number(reqBody.units)) /
          (stock.stocks + Number(reqBody.units));
        stock.stocks += Number(reqBody.units);
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
          pricePerUnit: reqBody.pricePerUnit,
          stocks: reqBody.units,
          location: locationInfo,
        });
        await newStock.save();
      }
      
    }

    const newRecording = new Recording({
      productCode: reqBody.code,
      mode: modeString,
      pricePerUnit: reqBody.pricePerUnit,
      units: reqBody.units,
      market: reqBody.market,
      location: locationInfo,
      taxes: tax,
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
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("returning");

    // const reqBody = await request.json();

    const recordingQuery = await Recording.find({productCode, mode: "selling"})

    console.log('recordingQuery', recordingQuery)

    const historyData = recordingQuery.map((oneData: any, index: any) => {
      return {
        key: index + 1,
        productCode: oneData.productCode,
        pricePerUnit: oneData.pricePerUnit,
        units: oneData.units,
        market: oneData.market,
        taxes: oneData.taxes,
        location: oneData.location,
        createdAt: oneData.createdAt,
      }
    })

    return NextResponse.json({
      message: "History Data fetched successfully.",
      data: {
        historyData,
      },
    }, {status: 201,} )

  } catch (error : any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
