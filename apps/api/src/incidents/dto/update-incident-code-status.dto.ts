import { IsIn } from 'class-validator';
import { UpdateIncidentCodeStatusRequest } from '@praesid/shared';

export class UpdateIncidentCodeStatusDto implements UpdateIncidentCodeStatusRequest {
  @IsIn(['HUMAN_CONFIRMED', 'NEEDS_REVIEW'])
  status: 'HUMAN_CONFIRMED' | 'NEEDS_REVIEW';
}
