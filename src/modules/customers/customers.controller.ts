import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @RequirePermissions('customers.read')
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @RequirePermissions('customers.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOneOrFail(id);
  }

  @RequirePermissions('customers.write')
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.createOrReuse(dto);
  }

  @RequirePermissions('customers.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @RequirePermissions('customers.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
