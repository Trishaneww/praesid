import { IsNotEmpty, IsString } from 'class-validator';

export class ListIncidentsDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
