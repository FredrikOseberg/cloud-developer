import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { AuthProvider } from '../../logic/authProvider'
import { TodosProvider } from '../../logic/todosProvider'

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const authProvider = new AuthProvider(event.headers.Authorization)
  const todosProvider = new TodosProvider()

  const todoId = event.pathParameters.todoId
  const userId = authProvider.getUserId()
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const sanitizedTodo = sanitize(updatedTodo)

  const { name, dueDate, done } = sanitizedTodo
  const valid = verifyRequest(name, dueDate, done)
  if (!valid) {
    return {
      statusCode: 400,
      body: 'Required fields were missing from body'
    }
  }

  try {
    await todosProvider.updateTodoItem(updatedTodo, userId, todoId)

    return {
      statusCode: 200,
      body: 'TodoItem updated',
      headers: {
        'Access-Control-Allow-Origin': '* '
      }
    }
  } catch {
    return {
      statusCode: 500,
      body: 'Could not update todoitem'
    }
  }
}

const verifyRequest = (
  name: string,
  dueDate: string,
  done: boolean | undefined
) => {
  if (!dueDate) return false
  if (!name) return false
  if (typeof done === 'undefined') return false
  return true
}

const sanitize = (item: UpdateTodoRequest) => {
  const newItem: UpdateTodoRequest = {
    dueDate: '',
    done: false,
    name: ''
  }

  newItem.dueDate = item.dueDate.toString()
  newItem.name = item.name.toString()

  if (item.done && typeof item.done === 'boolean') {
    newItem.done = item.done
  }

  return newItem
}
