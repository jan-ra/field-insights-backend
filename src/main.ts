import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import * as dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT);
}
bootstrap();
