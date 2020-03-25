import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

interface IDeleteKey {
  [key: string]: string
}

const XAWS = AWSXRay.captureAWS(AWS)

export class DatabaseProvider {
  private client = new XAWS.DynamoDB.DocumentClient()

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

  update = async (params: any) => {
    try {
      await this.client.update(params).promise()
    } catch (e) {
      console.log(e)
      throw new Error('Could not update todo')
    }
  }
}
