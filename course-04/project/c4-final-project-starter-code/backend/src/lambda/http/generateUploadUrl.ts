import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'

import { TodosProvider } from '../../logic/todosProvider'
import { AuthProvider } from '../../logic/authProvider'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const bucketName = process.env.IMAGES_S3_BUCKET
  const authProvider = new AuthProvider(event.headers.Authorization)

  const userId = authProvider.getUserId()
  const todosProvider = new TodosProvider()
  const uploadUrl = todosProvider.getUploadUrl(todoId)

  if (!todoId || !userId) {
    return {
      statusCode: 400,
      body: 'Bad request'
    }
  }

  try {
    const url = `https://${bucketName}.s3.amazonaws.com/${todoId}`
    await todosProvider.updateTodoImage(userId, todoId, url)

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl
      })
    }
  } catch (e) {
    console.log('Error getting upload url', e)
  }
}
