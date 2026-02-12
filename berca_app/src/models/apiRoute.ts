import type {NextRequest, NextResponse} from 'next/server'

export type ApiRoute<Params> = (request: NextRequest, {params}: {params: Promise<Params>}) => Promise<NextResponse>
