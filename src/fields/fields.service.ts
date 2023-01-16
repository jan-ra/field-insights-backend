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

  create(createFieldDto: CreateFieldDto): Promise<Field> {
    const fieldSize = this.earthEngineService.getSizeOfPolygon(
      createFieldDto.polygon,
    );
    const center = this.earthEngineService.getCenterOfPolygon(
      createFieldDto.polygon,
    );
    const indexMeans = this.earthEngineService.calculateIndicesOverTime(
      createFieldDto.polygon,
    );
    const createField = new this.fieldModel({
      ...createFieldDto,
      fieldSize,
      center,
      indexMeans,
    });
    return createField.save();
  }

  async findAll(): Promise<Field[]> {
    const fields = await this.fieldModel.find().lean().exec();

    return fields.map((f) => this.parsefield(f));
  }

  async findById(id: string): Promise<Field> {
    const field = await this.fieldModel.findById(id).lean().exec();
    return this.parsefield(field);
  }

  private parsefield(field: any) {
    const { polygon, center, ...rest } = field;
    const nPoly = polygon.map((e) => ({ lat: e[0], long: e[1] }));
    console.log(center);

    const nCenter = {
      lat: center[0].coordinates[0],
      long: center[0].coordinates[1],
    };
    return { polygon: nPoly, center: nCenter, ...rest };
  }
}
