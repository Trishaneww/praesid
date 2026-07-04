import { Module } from '@nestjs/common';
import { OiicsModule } from '../oiics/oiics.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { ClassificationService } from './classification.service';

@Module({
  imports: [OiicsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, ClassificationService],
  exports: [IncidentsService, ClassificationService],
})
export class IncidentsModule {}
