import { verify, decode } from 'jsonwebtoken'
import Axios from 'axios'

import { Jwt } from '../auth/Jwt'
import { IKey, IFilteredKey, JwtPayload } from '../auth/JwtPayload'

export class AuthProvider {
  private authHeader: string
  private jwksUrl = 'https://dev-g5wm-7ri.eu.auth0.com/.well-known/jwks.json'

  constructor(authHeader: string) {
    this.authHeader = authHeader
  }

  getToken(): string {
    if (!this.authHeader) throw new Error('No authentication header')

    if (!this.authHeader.toLowerCase().startsWith('bearer '))
      throw new Error('Invalid authentication header')

    const split = this.authHeader.split(' ')
    const token = split[1]

    return token
  }

  certToPEM(cert) {
    cert = cert.match(/.{1,64}/g).join('\n')
    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
    return cert
  }

  verifyToken = async (): Promise<any> => {
    const token = this.getToken()

    if (!token) {
      throw new Error('No token')
    }

    const jwt: Jwt = decode(token, { complete: true }) as Jwt
    const res = await Axios.get(this.jwksUrl)

    const keys = this.filterKeys(res.data.keys)

    if (!keys.length) {
      throw new Error('No keys available for signing')
    }

    const cert = keys.filter((key: IFilteredKey) => {
      if (jwt.header.kid === key.kid) {
        return key
      }
    })[0]

    if (!cert) {
      throw new Error('No key available for signing')
    }

    try {
      return verify(token, cert.publicKey, { algorithms: ['RS256'] })
    } catch {
      throw new Error('Incorrect token')
    }
  }

  filterKeys(keys: IKey[]): IFilteredKey[] {
    return keys
      .filter((key: IKey) => {
        if (
          key.use === 'sig' &&
          key.kty === 'RSA' &&
          key.kid &&
          ((key.x5c && key.x5c.length) || (key.n && key.e))
        ) {
          return key
        }
      })
      .map(
        (key: IKey): IFilteredKey => ({
          kid: key.kid,
          publicKey: this.certToPEM(key.x5c[0])
        })
      )
  }

  parseUserId(jwtToken: string): string {
    const decodedJwt = decode(jwtToken) as JwtPayload
    return decodedJwt.sub
  }

  getUserId(): string {
    const token = this.getToken()

    if (token) {
      return this.parseUserId(token)
    }
  }
}
