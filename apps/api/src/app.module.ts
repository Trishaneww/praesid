import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './lib/clients/clients.module';
import { OiicsModule } from './oiics/oiics.module';

@Module({
  imports: [ClientsModule, OiicsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
