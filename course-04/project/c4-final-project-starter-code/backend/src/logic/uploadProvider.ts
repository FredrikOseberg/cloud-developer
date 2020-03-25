import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpires = process.env.IMAGES_S3_BUCKET_URL_EXPIRATION

const XAWS = AWSXRay.captureAWS(AWS)

export class UploadProvider {
  private client = new XAWS.S3({ signatureVersion: 'v4' })

  getUploadUrl = (todoId: string) => {
    return this.client.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: urlExpires
    })
  }

  deleteImageFromS3 = async (todoId: string) => {
    return this.client
      .deleteObject({
        Bucket: bucketName,
        Key: todoId
      })
      .promise()
  }
}
