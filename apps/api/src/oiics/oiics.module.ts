import { Module } from '@nestjs/common';
import { OiicsController } from './oiics.controller';
import { OiicsService } from './oiics.service';

@Module({
  controllers: [OiicsController],
  providers: [OiicsService],
  exports: [OiicsService],
})
export class OiicsModule {}
