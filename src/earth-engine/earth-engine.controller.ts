import { Controller, Get } from '@nestjs/common';
import { EarthEngineService } from './earth-engine.service';

@Controller('earth-engine')
export class EarthEngineController {
  constructor(private earthEngineService: EarthEngineService) {}

  @Get()
  get() {
    return this.earthEngineService.getmap();
  }
}
