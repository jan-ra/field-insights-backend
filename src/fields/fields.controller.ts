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
    return this.fieldsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.fieldsService.findById(id);
  }
}
