import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'
import * as uuid from 'uuid'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { AuthProvider } from '../../logic/authProvider'
import { TodosProvider } from '../../logic/todosProvider'
import { TodoItem } from '../../models/TodoItem'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authProvider = new AuthProvider(event.headers.Authorization)
  const todosProvider = new TodosProvider()

  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const itemId = uuid.v4()

  const userId = authProvider.getUserId()

  const item: TodoItem = {
    todoId: itemId,
    userId: userId,
    ...newTodo
  }

  try {
    await todosProvider.createTodoItem(item)
  } catch (e) {
    return {
      statusCode: 500,
      body: 'Could not insert into db'
    }
  }

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item
    })
  }
}
