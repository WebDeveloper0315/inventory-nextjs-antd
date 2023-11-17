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

        const returning = searchParams.get('returning')
        console.log('selling parameter ', returning)
        
        const reqBody = await request.json()
        console.log('recording/route.ts', reqBody)
        
        let modeString = ''
        let marketString = ''
        let tax = 0
        if (buying) {
            modeString = 'buying'
        } else if (selling) {
            modeString = 'selling'
            marketString = reqBody.market
            tax = reqBody.taxes
        } else if(returning) {
            modeString = 'returning'
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
            } else if(returning) {
                stock.stocks += Number(reqBody.units)
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
            mode: modeString,
            pricePerUnit: reqBody.pricePerUnit,
            units: reqBody.units,
            market: marketString,
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