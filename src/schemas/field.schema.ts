import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FieldDocument = HydratedDocument<Field>;

@Schema()
export class Field {
  @Prop()
  name: string;

  @Prop()
  cropType: string;

  @Prop()
  fieldSize: number;

  @Prop()
  polygon: number[][];

  @Prop()
  center: number[];

  @Prop()
  indexMeans: any[];
}

export const FieldSchema = SchemaFactory.createForClass(Field);
