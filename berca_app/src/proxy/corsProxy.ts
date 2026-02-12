import type {NextRequest, NextResponse} from 'next/server'

export function corsProxy(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.nextUrl.pathname.startsWith('/api')) return response

  // Zonder deze header, worden alle requests vanuit JavaScript in een browser genegeerd.
  // Via * zeggen we dat alle requests vanuit elke bron toegestaan zijn.
  // Dit is natuurlijk niet echt veilig tenzij je nog een authenticatie mechanisme toevoegt.
  response.headers.set('Access-Control-Allow-Origin', '*')

  // Voor PUT en DELETE request en ook POST requests die geen FormData bevatten stuurt de browser een preflight request
  // via de OPTIONS methode.
  // Dit request controleert wat er toegestaan is en bepaald of de browser het echte request stuurt of niet.
  if (request.method === 'OPTIONS') {
    // Sta toe dat de Content-Type header gebruikt wordt, dit is nodig als je JSON-data wilt versturen.
    // Sta toe dat de Authorization header gebruikt wordt.
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    // Sta toe dat de methodes GET, POST, PUT en DELETE gebruikt worden.
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  }

  return response
}
