import { S3Client } from '@aws-sdk/client-s3';
import { FileConfig } from './file-config.type';

export function createS3Client(
  config: Pick<FileConfig, 'awsS3Region' | 'awsS3Endpoint' | 'awsS3ForcePathStyle' | 'accessKeyId' | 'secretAccessKey'>,
): S3Client {
  return new S3Client({
    region: config.awsS3Region ?? '',
    ...(config.awsS3Endpoint && { endpoint: config.awsS3Endpoint, forcePathStyle: config.awsS3ForcePathStyle }),
    credentials: {
      accessKeyId: config.accessKeyId ?? '',
      secretAccessKey: config.secretAccessKey ?? '',
    },
  });
}
