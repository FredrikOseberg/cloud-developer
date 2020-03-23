import * as AWS from 'aws-sdk'

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpires = process.env.IMAGES_S3_BUCKET_URL_EXPIRATION

export class UploadProvider {
  private client = new AWS.S3({ signatureVersion: 'v4' })

  getUploadUrl = (todoId: string) => {
    return this.client.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: urlExpires
    })
  }
}
