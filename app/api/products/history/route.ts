import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { validateJWT } from "@/helpers/validateJWT";
connectDB();

export async function POST(request: NextRequest) {
    await validateJWT(request);
    try {
      const { searchParams } = new URL(request.url);
      const productCode = searchParams.get("returning");
  
      const reqBody = await request.json();
      // console.log('reqBody', reqBody);
      
      const start = reqBody.start; // Access the start date from the JSON data
      const end = reqBody.end; // Access the end date from the JSON data
  
      const recordingQuery = await Recording.find({productCode, mode: "selling", createdAt: { $gte: start, $lte: end } })
  
      // console.log('recordingQuery', recordingQuery)
  
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
  