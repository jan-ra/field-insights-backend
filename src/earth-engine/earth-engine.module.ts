import { Module } from '@nestjs/common';
import { EarthEngineService } from './earth-engine.service';
import { EarthEngineController } from './earth-engine.controller';

@Module({
  providers: [EarthEngineService],
  controllers: [EarthEngineController]
})
export class EarthEngineModule {}
