import { DatabaseProvider } from './databaseProvider'
import { TodoItem } from '../models/TodoItem'
import { UploadProvider } from './uploadProvider'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import { createLogger } from '../utils/logger'

export class TodosProvider {
  private tableName = process.env.TODOS_TABLE
  private dbProvider = new DatabaseProvider()
  private uploadProvider = new UploadProvider()
  private logger = createLogger('todo')

  createTodoItem = async (item: TodoItem) => {
    try {
      this.logger.info('creating todo item')
      await this.dbProvider.create(this.tableName, item)
    } catch (e) {
      this.logger.error('errror creating todo item ', e)
      throw new Error('Unable to create item')
    }
  }

  deleteTodoItem = async (userId: string, todoId: string) => {
    const keys = {
      todoId,
      userId
    }

    try {
      this.logger.info('deleting todo item')

      await this.uploadProvider.deleteImageFromS3(todoId)
      await this.dbProvider.delete(this.tableName, keys)
    } catch (e) {
      this.logger.error('error deleting todo item: ', e)

      throw new Error('Unable to delete item')
    }
  }

  getAllTodoItems = async (userId: string) => {
    const expressionAttributeValues: IExpressionAttributeValues = {
      ':userId': userId
    }

    const keyConditionExpression = 'userId = :userId'

    try {
      this.logger.info('retrieving todoitems for user: ', userId)

      const result = await this.dbProvider.query(
        this.tableName,
        keyConditionExpression,
        expressionAttributeValues
      )

      return result
    } catch (e) {
      this.logger.error('error retrieving todo items for user ', e)
      throw new Error('Unable to get todo items')
    }
  }

  getUploadUrl = (todoId: string) => {
    this.logger.info('retrieving upload url')

    const uploadUrl = this.uploadProvider.getUploadUrl(todoId)
    return uploadUrl
  }

  updateTodoItem = async (
    updatedInformation: UpdateTodoRequest,
    userId: string,
    todoId: string
  ) => {
    const { name, dueDate, done } = updatedInformation
    const params = {
      TableName: this.tableName,
      Key: {
        userId: userId,
        todoId: todoId
      },
      KeyConditionExpression: '#na = :title',
      ExpressionAttributeNames: {
        '#na': 'name'
      },
      UpdateExpression: 'set #na = :title, dueDate = :d, done = :do',
      ExpressionAttributeValues: {
        ':title': name,
        ':d': dueDate,
        ':do': done
      },
      ReturnValues: 'UPDATED_NEW'
    }

    try {
      this.logger.info('Updating todo item')
      await this.dbProvider.update(params)
    } catch (e) {
      this.logger.error('Error updating todo item: ', e)
      throw new Error('Could not update todo')
    }
  }

  updateTodoImage = async (
    userId: string,
    todoId: string,
    attachmentUrl: string
  ) => {
    const params = {
      TableName: this.tableName,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set attachmentUrl = :u',
      ExpressionAttributeValues: {
        ':u': attachmentUrl
      },
      ReturnValues: 'UPDATED_NEW'
    }

    try {
      this.logger.info('Updating todo item image')

      await this.dbProvider.update(params)
    } catch (e) {
      this.logger.error('Error updating todo image: ', e)
      throw new Error('Could not update todo')
    }
  }
}
