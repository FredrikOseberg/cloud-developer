import { DatabaseProvider } from './databaseProvider'
import { TodoItem } from '../models/TodoItem'

export class TodosProvider {
  private tableName = process.env.TODOS_TABLE
  private dbProvider = new DatabaseProvider()

  createTodoItem = async (item: TodoItem) => {
    try {
      await this.dbProvider.create(this.tableName, item)
    } catch {
      throw new Error('Unable to create item')
    }
  }

  deleteTodoItem = async (userId: string, todoId: string) => {
    const keys = {
      todoId,
      userId
    }

    try {
      await this.dbProvider.delete(this.tableName, keys)
    } catch {
      throw new Error('Unable to delete item')
    }
  }

  getAllTodoItems = async (userId: string) => {
    const expressionAttributeValues: IExpressionAttributeValues = {
      ':userId': userId
    }

    const keyConditionExpression = 'userId = :userId'

    try {
      const result = await this.dbProvider.query(
        this.tableName,
        keyConditionExpression,
        expressionAttributeValues
      )

      return result
    } catch {
      throw new Error('Unable to get todo items')
    }
  }
}
