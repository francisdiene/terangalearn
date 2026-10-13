import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SECRET = process.env.SUPERADMIN_SECRET

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!SECRET || password !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('sa_token', SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 heures
    path: '/superadmin',
  })

  return NextResponse.json({ ok: true })
}
