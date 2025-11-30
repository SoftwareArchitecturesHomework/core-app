import { getServerSession } from '#auth'
import { useRuntimeConfig } from '#imports'
import type { H3Event } from 'h3'
import { getCookie, setCookie } from 'h3'
import { SignJWT, jwtVerify } from 'jose'
import { createPrivateKey, type KeyObject } from 'node:crypto'

export type UserClaims = {
  iat?: number
  exp?: number
  email?: string | null
  name?: string | null
  role?: string
}

const COOKIE_NAME = 'user_jwt'
const EXP_SECONDS = 60 * 60 // 1 hour
let cachedKey: KeyObject | null = null

function getPrivateKey(): KeyObject {
  if (!cachedKey) {
    const { jwtPrivateKey } = useRuntimeConfig()
    cachedKey = importRsaPrivateKey(jwtPrivateKey)
  }

  return cachedKey
}

function importRsaPrivateKey(pem: string): KeyObject {
  const trimmed = pem.trim()
  if (!trimmed) throw new Error('Empty private key')
  return createPrivateKey({ key: trimmed, format: 'pem' })
}

export async function useJwt(event: H3Event): Promise<string> {
  const session = await getServerSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, statusMessage: 'No session' })
  }

  const claims: UserClaims = {
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role,
  }

  const key = getPrivateKey()
  const existing = getCookie(event, COOKIE_NAME)
  if (existing) {
    try {
      await jwtVerify(existing, key)
      return existing
    } catch {}
  }

  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + EXP_SECONDS)
    .sign(key)

  setCookie(event, COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: EXP_SECONDS,
  })

  return jwt
}
