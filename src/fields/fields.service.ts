import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Field, FieldDocument } from 'src/schemas/field.schema';
import { CreateFieldDto } from './dto/create-field.dto';
@Injectable()
export class FieldsService {
  constructor(
    @InjectModel(Field.name) private fieldModel: Model<FieldDocument>,
  ) {}

  async create(createFieldDto: CreateFieldDto): Promise<Field> {
    const createdCat = new this.fieldModel(createFieldDto);
    return createdCat.save();
  }

  async findAll(): Promise<Field[]> {
    return this.fieldModel.find().exec();
  }
}
