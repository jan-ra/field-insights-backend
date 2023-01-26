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
      const fyield = this.provideEstimate(field.name, e.date);
      return { ...e, predictedyield: fyield };
    });
    return { polygon: nPoly, center: nCenter, indexMeans: added, ...rest };
  }

  private provideEstimate(id, date) {
    const corn1 = [
      {
        date: '2022-03-16',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-03-18',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-03-21',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-03-23',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-03-26',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-04-17',
        predictedyield: 595797.926347,
      },
      {
        date: '2022-04-20',
        predictedyield: 595797.926347,
      },
      {
        date: '2022-04-22',
        predictedyield: 600895.087177,
      },
      {
        date: '2022-05-02',
        predictedyield: 608903.725907,
      },
      {
        date: '2022-05-12',
        predictedyield: 595797.926347,
      },
      {
        date: '2022-06-09',
        predictedyield: 592228.373711,
      },
      {
        date: '2022-06-11',
        predictedyield: 589178.326001,
      },
      {
        date: '2022-06-16',
        predictedyield: 582907.769677,
      },
      {
        date: '2022-07-04',
        predictedyield: 582907.769677,
      },
      {
        date: '2022-07-19',
        predictedyield: 582907.769677,
      },
      {
        date: '2022-07-24',
        predictedyield: 582907.769677,
      },
    ];

    const corn2 = [
      {
        date: '2022-04-17',
        predictedyield: 592228.373711,
      },
      {
        date: '2022-04-20',
        predictedyield: 592228.373711,
      },
      {
        date: '2022-04-22',
        predictedyield: 592228.373711,
      },
      {
        date: '2022-05-02',
        predictedyield: 592228.373711,
      },
      {
        date: '2022-05-12',
        predictedyield: 580051.107897,
      },
      {
        date: '2022-06-09',
        predictedyield: 582907.769677,
      },
      {
        date: '2022-06-11',
        predictedyield: 580051.107897,
      },
      {
        date: '2022-07-04',
        predictedyield: 580051.107897,
      },
      {
        date: '2022-07-19',
        predictedyield: 580051.107897,
      },
      {
        date: '2022-07-24',
        predictedyield: 580051.107897,
      },
    ];

    const data = id == 'corn 1' ? corn1 : corn2;
    const res = data.find((e) => e.date == date);

    return res ? res.predictedyield : null;
  }
}
