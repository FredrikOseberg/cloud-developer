/**
 * A payload of a JWT token
 */
export interface JwtPayload {
  iss: string
  sub: string
  iat: number
  exp: number
}

export interface IKey {
  alg: string
  kty: string
  use: string
  x5c: string[]
  n: string
  e: string
  kid: string
  x5t: string
}

export interface IFilteredKey {
  kid: string
  publicKey: string
}
