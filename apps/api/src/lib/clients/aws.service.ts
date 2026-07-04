import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  readonly s3 = new S3Client({ region: process.env.AWS_REGION });
}
