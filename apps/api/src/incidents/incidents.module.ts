import { Module } from '@nestjs/common';
import { OiicsModule } from '../oiics/oiics.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { ClassificationService } from './classification.service';
import { IncidentsRepository } from './incidents.repository';

@Module({
  imports: [OiicsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, ClassificationService, IncidentsRepository],
  exports: [IncidentsService, ClassificationService, IncidentsRepository],
})
export class IncidentsModule {}
