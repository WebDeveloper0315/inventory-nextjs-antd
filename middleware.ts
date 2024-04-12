import { NextRequest, NextResponse } from "next/server";

export async function middleware(request:NextRequest) {
    try {
        const isPublicPage = request.nextUrl.pathname === '/login'

        // if there is no token and the page is not public , redirect to login

        const token = request.cookies.get('token')?.value
        // console.log(token, "isPublicPage")
        if(!token && !isPublicPage){
            return NextResponse.redirect(new URL('/login', request.nextUrl))
        }

        // if there is token and the page is public, redirect to home page
        if(token && isPublicPage){
            return NextResponse.redirect(new URL('/', request.nextUrl))
        }

        return NextResponse.next()
    } catch (error) {
        return NextResponse.error()
    }
    // console.log('middleware', request.nextUrl.pathname)
    // return NextResponse.next()
    
}

export const config = {
    matcher: ['/', '/login']
}