import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Field, FieldSchema } from 'src/schemas/field.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Field.name, schema: FieldSchema }]),
  ],
  controllers: [FieldsController],
  providers: [FieldsService],
})
export class FieldsModule {}
