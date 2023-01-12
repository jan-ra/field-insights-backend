import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Field, FieldDocument } from 'src/schemas/field.schema';
import { CreateFieldDto } from './dto/create-field.dto';
import { EarthEngineService } from 'src/earth-engine/earth-engine.service';
@Injectable()
export class FieldsService {
  constructor(
    @InjectModel(Field.name) private fieldModel: Model<FieldDocument>,
    private earthEngineService: EarthEngineService,
  ) {}

  async create(createFieldDto: CreateFieldDto): Promise<Field> {
    const fieldSize = this.earthEngineService.getSizeOfPolygon(
      createFieldDto.polygon,
    );
    const center = this.earthEngineService.getCenterOfPolygon(
      createFieldDto.polygon,
    );
    //this.earthEngineService.calculateNDVI(createFieldDto.polygon);
    const createField = new this.fieldModel({
      ...createFieldDto,
      fieldSize,
      center,
    });
    return createField.save();
  }

  async findAll(): Promise<Field[]> {
    return this.fieldModel.find().exec();
  }

  async findById(id: string): Promise<Field> {
    return this.fieldModel.findById(id).exec();
  }
}
