import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { OiicsSearchRequest } from '@praesid/shared';

export class SearchOiicsCodesDto implements OiicsSearchRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  narrative: string;
}
