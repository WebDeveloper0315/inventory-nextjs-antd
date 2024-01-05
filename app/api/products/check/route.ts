import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/productModel";
import Stock from "@/models/stockModel";
import Location from "@/models/locationModel";

connectDB();

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  console.log("Product Code: ", code);

  const locationQuery = request.nextUrl.searchParams.get("location");
  console.log("location Code: ", locationQuery);
  try {
    // Find the product in MongoDB using the product code
    if(code){
      const product = await Product.findOne({ productCode: code });

      if (!product) {
        return NextResponse.json(
          {
            message: "Product not found!",
            data: "",
          },
          {
            status: 200,
          }
        );
      }

      const allData = await Stock.find({ productCode: code });
      console.log(allData);

      const stockData = allData.map((oneData) => {
        return {
          location: oneData.location,
          pricePerUnit: oneData.pricePerUnit,
          stocks: oneData.stocks,
        };
      });

      return NextResponse.json(
        {
          message: "Product data fetched successfully",
          data: {
            product,
            stockData,
          },
        },
        {
          status: 201,
        }
      );
    } else if(locationQuery){
      const allData = await Stock.find({ location: locationQuery });
      console.log(allData);

      const stockData = allData.map((oneData) => {
        return {
          productCode: oneData.productCode,
          pricePerUnit: oneData.pricePerUnit,
          stocks: oneData.stocks,
        };
      });

      const locationData = await Location.findOne({location: locationQuery});
      console.log("locationData", locationData)
      if(locationData){
        return NextResponse.json(
          {
            message: "Location data fetched successfully",
            data: {
              locationData,
              stockData,
            },
          },
          {
            status: 201,
          }
        );
      }
      

    }
    
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something Went Wrong" },
      { status: 500 }
    );
  }
}
