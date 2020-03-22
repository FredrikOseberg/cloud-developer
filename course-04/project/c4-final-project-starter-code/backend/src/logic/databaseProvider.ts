import * as AWS from 'aws-sdk'

interface IDeleteKey {
  [key: string]: string
}

export class DatabaseProvider {
  private client = new AWS.DynamoDB.DocumentClient()

  create = async (tableName: string, item: any) => {
    try {
      await this.client
        .put({
          Item: item,
          TableName: tableName
        })
        .promise()
    } catch {
      throw new Error('Could not create item')
    }
  }

  delete = async (tableName: string, keys: IDeleteKey) => {
    try {
      await this.client
        .delete({
          TableName: tableName,
          Key: {
            ...keys
          }
        })
        .promise()
    } catch {
      throw new Error('Could not delete item')
    }
  }

  query = async (
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: IExpressionAttributeValues
  ) => {
    const queryParams = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues
    }

    try {
      const result = await this.client.query(queryParams).promise()
      return result
    } catch (e) {
      console.log(e)
      throw new Error('Could not retrieve todos')
    }
  }

  update = () => {}

  get = () => {}
}
