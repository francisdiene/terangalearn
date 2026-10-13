import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pw } = await req.json()
  const secret = process.env.SUPERADMIN_SECRET

  if (!secret || pw !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('sa', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
