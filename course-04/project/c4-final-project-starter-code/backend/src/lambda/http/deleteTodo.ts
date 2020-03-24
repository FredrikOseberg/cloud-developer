import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'

import { AuthProvider } from '../../logic/authProvider'
import { TodosProvider } from '../../logic/todosProvider'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authProvider = new AuthProvider(event.headers.Authorization)
  const todosProvider = new TodosProvider()
  const todoId = event.pathParameters.todoId
  const userId = authProvider.getUserId()

  if (!todoId || !userId) {
    return {
      statusCode: 400,
      body: 'Bad request'
    }
  }

  try {
    await todosProvider.deleteTodoItem(userId, todoId)

    return {
      statusCode: 200,
      body: 'Item deleted',
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  } catch (e) {
    console.log(e)
    return {
      statusCode: 404,
      body: 'Could not find item to delete.'
    }
  }
}
