import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/productModel";
import { promises as fsPromises } from 'fs'

connectDB();

export async function POST(request: NextRequest) {
    try {
      const reqBody = await request.json();
      console.log(reqBody)
      //check if user already exists
      const product = await Product.findOne({ code: reqBody.code });
      if (product) {
        throw new Error("Product already exists");
      }
      const imageName = 'productImage/' + reqBody.image.file.uid
      
    //   // I want to save image file to the server.
    //   const filePath = `.${imageName}`;
    //   await fsPromises.writeFile(filePath, reqBody.image.file.data);

    //   console.log(imageName)
      // create user
      const newProduct = new Product({
        productCode: reqBody.code,
        productImage: imageName,
        // newProduct: reqBody.userAuthority.includes('newProduct'),
        disposableUnits: reqBody.unit,
        pricePerUnit: reqBody.price,
        location: reqBody.location,
      })
  
      await newProduct.save()
  
      return NextResponse.json(
        { message: "Product Created Successfully", success: true },
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }