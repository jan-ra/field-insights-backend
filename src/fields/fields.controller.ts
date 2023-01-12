import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateFieldDto } from './dto/create-field.dto';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private fieldsService: FieldsService) {}

  @Post()
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  async list() {
    const list = await this.fieldsService.findAll();
    return list.map((e) => ({
      //@ts-ignore
      ...e._doc,
      currentMeanNDVI: 0.7,
      currentMeanNDWI: 0.9,
    }));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const element = await this.fieldsService.findById(id);
    //@ts-ignore
    return { ...element._doc, currentMeanNDVI: 0.7, currentMeanNDWI: 0.9 };
  }
}
