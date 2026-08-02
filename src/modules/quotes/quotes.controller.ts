import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { ConvertQuoteDto } from './dto/convert-quote.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @RequirePermissions('quotes.read')
  @Get()
  findAll() {
    return this.quotesService.findAll();
  }

  @RequirePermissions('quotes.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOneOrFail(id);
  }

  @RequirePermissions('quotes.read')
  @Get(':id/lines')
  findLines(@Param('id') id: string) {
    return this.quotesService.findLines(id);
  }

  @RequirePermissions('quotes.write')
  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.createQuote(dto);
  }

  @RequirePermissions('quotes.write')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.quotesService.updateStatus(id, dto);
  }

  @RequirePermissions('quotes.write')
  @Post(':id/convert')
  convert(@Param('id') id: string, @Body() dto: ConvertQuoteDto) {
    return this.quotesService.convertToSale(id, dto);
  }
}
