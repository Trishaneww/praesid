import { IsNotEmpty, IsString } from 'class-validator';
import { CreateBulkUploadRequest } from '@praesid/shared';

export class CreateBulkUploadDto implements CreateBulkUploadRequest {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  contentBase64: string;
}
