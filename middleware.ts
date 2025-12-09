import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
        return NextResponse.next()
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
        const authCookie = request.cookies.get('admin_session')

        if (!authCookie || authCookie.value !== 'true') {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/admin/:path*',
}
