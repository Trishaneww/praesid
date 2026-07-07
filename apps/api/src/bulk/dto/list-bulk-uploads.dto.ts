import { IsNotEmpty, IsString } from 'class-validator';

export class ListBulkUploadsDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
