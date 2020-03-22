import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'

import { AuthProvider } from '../../logic/authProvider'
import { TodosProvider } from '../../logic/todosProvider'
import { PromiseResult } from 'aws-sdk/lib/request'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { AWSError } from 'aws-sdk'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authProvider = new AuthProvider(event.headers.Authorization)
  const todosProvider = new TodosProvider()

  const userId = authProvider.getUserId()

  let result: PromiseResult<DocumentClient.QueryOutput, AWSError>
  try {
    result = await todosProvider.getAllTodoItems(userId)
  } catch (e) {
    console.log(e)
    return {
      statusCode: 404,
      body: 'Could not find any todo items'
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: result.Items
    })
  }
}
