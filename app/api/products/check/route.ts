import { connectDB } from "@/config/dbConfig"
import { NextRequest, NextResponse } from "next/server"
import Product from "@/models/productModel";

connectDB();

export async function GET(request: NextRequest) {
    // I need to analyse the request.
    const productCode = request.nextUrl.searchParams.get('code')
    console.log('Product Code: ', productCode)
    try {
        // Find the product in MongoDB using the product code
        const product = await Product.findOne({ productCode: productCode });

        if (!product) {
            return NextResponse.json({
                message: "Product not found!", 
                data: '',
            }, {
                status: 200
            })
        }

        return NextResponse.json({
            message: 'Product data fetched successfully',
            data: product,
          }, {
            status: 201
          })
        
    } catch (error: any) {
        return NextResponse.json({message: "Something Went Wrong"}, {status: 500})
    }
}