import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateIncidentRequest } from '@praesid/shared';

export class CreateIncidentDto implements CreateIncidentRequest {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  narrative: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reportedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalRef?: string;
}
