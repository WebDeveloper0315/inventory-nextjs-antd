import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { requirePermission, errorResponse } from "@/helpers/auth";
import { toNumber } from "@/lib/money";
import { buildDateRange, displayTimestamp } from "@/lib/dates";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(request, "returning");
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("returning");

    const reqBody = await request.json();

    // Coerce the request bounds into real Dates. A date-only "end" now covers
    // the whole day (previously the end day was silently excluded), and an
    // invalid/inverted range returns 400 instead of quietly finding nothing.
    const createdAt = buildDateRange(reqBody?.start, reqBody?.end);

    const recordingQuery = await Recording.find({
      productCode,
      mode: "selling",
      createdAt,
    }).sort({ createdAt: 1 });

    const historyData = recordingQuery.map((oneData: any, index: number) => ({
      key: index + 1,
      productCode: oneData.productCode,
      pricePerUnit: toNumber(oneData.pricePerUnit),
      units: oneData.units,
      market: oneData.market,
      taxes: oneData.taxes,
      location: oneData.location,
      // ISO-8601 from the real timestamp (falls back to legacy createdTime for
      // documents written before the date cleanup).
      createdAt: displayTimestamp(oneData),
    }));

    return NextResponse.json(
      {
        message: "History Data fetched successfully.",
        data: {
          historyData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
