import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Field, FieldDocument } from 'src/schemas/field.schema';
import { CreateFieldDto } from './dto/create-field.dto';
import { EarthEngineService } from 'src/earth-engine/earth-engine.service';
import * as moment from 'moment';
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
    const { polygon, center, indexMeans, ...rest } = field;
    const nPoly = polygon.map((e) => ({ lat: e[1], long: e[0] }));
    console.log(center);

    const nCenter = {
      lat: center[0].coordinates[1],
      long: center[0].coordinates[0],
    };

    const added = indexMeans.map((e) => {
      const inFrame = moment(e.date).isAfter('2022-03-01');
      const monthdiff = moment(e.date).diff('2022-03-01', 'month', true);
      return { ...e, predictedyield: inFrame ? 500 + monthdiff * 10 : null };
    });
    return { polygon: nPoly, center: nCenter, indexMeans: added, ...rest };
  }
}
