
import { NextRequest } from "next/server"
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'


export const validateJWT = async (request: NextRequest) => {
    try {
        const token = request.cookies.get('token')?.value
        
        if (!token) {
            throw new Error("No token found")
        }
        const decodedData:any = await jwt.verify(token, process.env.JWT_SECRET!)

        const extendedToken = jwt.sign({
            userId: decodedData.userId
        }, process.env.JWT_SECRET!, { expiresIn: '10m' });
        
        cookies().set("token", extendedToken, {
            httpOnly: true,
            maxAge: 10 * 60 * 1000, // 10mins
          })
        // I need to extend the expire time in current token
        return decodedData.userId
    } catch (error: any) {
        cookies().delete('token')
    }
}