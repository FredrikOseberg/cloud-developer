import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload, IKey, IFilteredKey } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-g5wm-7ri.eu.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  if (!token) {
    throw new Error('No token')
  }

  if (!token.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid token')
  }

  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const res = await Axios.get(jwksUrl)
  const keys = filterKeys(res.data.keys)

  if (!keys.length) {
    throw new Error('No keys available for signing')
  }

  const cert = keys.filter((key: IFilteredKey) => {
    if (jwt.header.kid === key.kid) {
      return key
    }
  })[0]

  if (!cert) {
    throw new Error('No keys available for signing')
  }

  return verify(token, cert.publicKey, { algorithms: ['RS256'] })
}

function filterKeys(keys: IKey[]): IFilteredKey[] {
  return keys
    .filter((key: IKey) => {
      if (
        key.use === 'use' &&
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
        publicKey: certToPEM(key.x5c[0])
      })
    )
}

function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
