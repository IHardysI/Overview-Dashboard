import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:3001'

async function proxyRequest(request: NextRequest, path: string[]) {
    const url = new URL(request.url)
    const backendUrl = `${BACKEND_URL}/${path.join('/')}`
    const searchParams = url.searchParams.toString()
    const finalUrl = searchParams ? `${backendUrl}?${searchParams}` : backendUrl

    const headers = new Headers()
    request.headers.forEach((value, key) => {
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
            headers.set(key, value)
        }
    })

    const options: RequestInit = {
        method: request.method,
        headers,
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        options.body = await request.text()
    }

    try {
        const response = await fetch(finalUrl, options)
        const data = await response.text()
        
        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
            },
        })
    } catch {
        return NextResponse.json(
            { error: 'Backend connection failed' },
            { status: 502 }
        )
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const params = await context.params
    return proxyRequest(request, params.path)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const params = await context.params
    return proxyRequest(request, params.path)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const params = await context.params
    return proxyRequest(request, params.path)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const params = await context.params
    return proxyRequest(request, params.path)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const params = await context.params
    return proxyRequest(request, params.path)
}