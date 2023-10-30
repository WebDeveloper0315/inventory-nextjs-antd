import { connectDB } from "@/config/dbConfig"
import { NextRequest, NextResponse } from "next/server"
import Recording from "@/models/recordingModel"
import Stock from "@/models/stockModel"
import { validateJWT } from "@/helpers/validateJWT"
connectDB()


export async function POST(request: NextRequest) {
    try {
        await validateJWT(request)
        
        const {searchParams} = new URL(request.url)
        const buying = searchParams.get('buying')
        console.log('buying parameter ', buying)

        const selling = searchParams.get('selling')
        console.log('selling parameter ', selling)
        
        const reqBody = await request.json()
        console.log('recording/route.ts', reqBody)
        
        let mode = ''
        let market = ''
        let tax = 0
        if (buying) {
            mode = 'buying'
        } else if (selling) {
            mode = 'selling'
            market = reqBody.market
            tax = reqBody.taxes
        }
        
        

        // const stock = await Stock.findOne({ productCode: reqBody.code,  pricePerUnit: reqBody.pricePerUnit})
        const stock = await Stock.findOne({ productCode: reqBody.code})
        
        if(stock){
            if (buying) {
                stock.stocks += Number(reqBody.units)
        
            } else if (selling) {
                if(stock.stocks >= Number(reqBody.units))
                    stock.stocks -= Number(reqBody.units)
                else
                return NextResponse.json(
                    { message: "Stock not Enough!", success: false },
                    { status: 400 }
                )
            }
            await stock.save();
            
        }
        else {
            const newStock = new Stock({
                productCode: reqBody.code,
                pricePerUnit: reqBody.pricePerUnit,
                stocks: reqBody.units,
            })

            await newStock.save()
        }


        const newRecording = new Recording({
            productCode: reqBody.code,
            mode: mode,
            pricePerUnit: reqBody.pricePerUnit,
            units: reqBody.units,
            market: market,
            taxes: tax,
        })

        await newRecording.save()

        return NextResponse.json(
            { message: "Record Saved Successfully", success: true },
            { status: 201 }
        )
    } catch (error:any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}