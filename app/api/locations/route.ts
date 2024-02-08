import { connectDB } from "@/config/dbConfig";
import Location from "@/models/locationModel";
import Stock from "@/models/stockModel";
import { NextRequest, NextResponse } from "next/server";

connectDB();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { updating, locationMessage, selectedLocations, status } = body;
  // console.log('selected locations', selectedLocations)

  try {
    const locationQuery = await Location.findOne({ location: locationMessage });
    if (locationQuery) {
      if (status === "description") {
        locationQuery.description = updating;
        locationQuery.save();
        return NextResponse.json(
          { message: "Location Description Saved Successfully", success: true },
          { status: 201 }
        );
      } else if (status === "change") {
        const locationQueryNew = await Location.findOne({ location: updating });
        if(!locationQueryNew){
          const newLocation = new Location({
            location: updating,
            description: "",
          });
          await newLocation.save();
        }
        // locationQuery.location = updating;
        // locationQuery.save();

        const stocksToUpdate = await Stock.find({ location: locationMessage, productCode: { $in: selectedLocations } });

        for (const stock of stocksToUpdate) {
          stock.location = updating;
          await stock.save();
        }

        return NextResponse.json(
            { message: "Location Information Changed Successfully", success: true },
            { status: 201 }
          );
      }
    } else {
      return NextResponse.json(
        { message: "Location Information can't be found", success: false },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest){
  try {
    const allLocations = await Location.find();
    return NextResponse.json({ locations: allLocations, success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
