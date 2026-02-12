import 'server-only'
import {NextResponse} from 'next/server'

/**
 * Return a 200 OK response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function ok(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(200, body, headers)
}

/**
 * Return a 201 Created response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function created(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(201, body, headers)
}

/**
 * Return a 400 badRequest response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function badRequest(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(400, body, headers)
}

/**
 * Return a 401 Unauthorized response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function unauthorized(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(401, body, headers)
}

/**
 * Return a 403 Forbidden response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function forbidden(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(403, body, headers)
}

/**
 * Return a 500 Internal Server Error response.
 *
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
export function internalServerError(body?: unknown, headers: HeadersInit = {}): NextResponse {
  return buildRequest(500, body, headers)
}

/**
 * Build a NextResponse object using the provided parameters.
 *
 * @param status The HTTP status code to return.
 * @param body The optional response body. Must be serializable to JSON.
 * @param headers Any extra headers to include in the response.
 */
function buildRequest(status: number, body?: unknown, headers: HeadersInit = {}): NextResponse {
  return new NextResponse(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}
