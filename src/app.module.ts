import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FieldsModule } from './fields/fields.module';
import { EarthEngineModule } from './earth-engine/earth-engine.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    FieldsModule,
    EarthEngineModule,
    MongooseModule.forRoot('mongodb://localhost:27018/field-insights'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
