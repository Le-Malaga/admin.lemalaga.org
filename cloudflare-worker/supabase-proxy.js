/**
 * Cloudflare Worker: Custom Domain Proxy for Le Malaga Supabase Backend
 * Route: api.lemalaga.org/*
 * Target: https://ybovhrbnbednnxppofmv.supabase.co
 *
 * Hides `ybovhrbnbednnxppofmv.supabase.co` behind `https://api.lemalaga.org`
 * for REST API calls, Auth, and Storage public image URLs — 100% free on Cloudflare Workers.
 */

const SUPABASE_ORIGIN = 'https://ybovhrbnbednnxppofmv.supabase.co'
const SUPABASE_HOST = 'ybovhrbnbednnxppofmv.supabase.co'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const targetUrl = new URL(url.pathname + url.search, SUPABASE_ORIGIN)

    // Handle CORS preflight immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            request.headers.get('Access-Control-Request-Headers') ||
            'authorization, x-client-info, apikey, content-type, x-upsert',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const headers = new Headers(request.headers)
    headers.set('Host', SUPABASE_HOST)

    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual',
    })

    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  },
}
