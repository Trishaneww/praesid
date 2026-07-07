import { Module } from '@nestjs/common';
import { OiicsController } from './oiics.controller';
import { OiicsService } from './oiics.service';
import { OiicsRepository } from './oiics.repository';

@Module({
  controllers: [OiicsController],
  providers: [OiicsService, OiicsRepository],
  exports: [OiicsService, OiicsRepository],
})
export class OiicsModule {}
