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

  if (!userId) {
    return {
      statusCode: 400,
      body: 'Invalid userId'
    }
  }

  const valid = validate(newTodo)
  if (!valid) {
    return {
      statusCode: 500,
      body: 'Could not insert into db'
    }
  }

  const sanitizedItem = sanitize(newTodo)
  const item: TodoItem = {
    todoId: itemId,
    userId: userId,
    ...sanitizedItem
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

const validate = (newTodo: CreateTodoRequest) => {
  if (!newTodo.name || typeof newTodo.name !== 'string') return false
  if (!newTodo.dueDate || typeof newTodo.dueDate !== 'string') return false
  return true
}

const sanitize = (item: CreateTodoRequest) => {
  const newItem: CreateTodoRequest = {
    dueDate: '',
    name: ''
  }

  if (item.attachmentUrl) {
    newItem.attachmentUrl = item.attachmentUrl.toString()
  }

  if (item.createdAt) {
    newItem.createdAt = item.createdAt.toString()
  }

  newItem.dueDate = item.dueDate.toString()
  newItem.name = item.name.toString()

  if (item.done && typeof item.done === 'boolean') {
    newItem.done = item.done
  }

  return newItem
}
