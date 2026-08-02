import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { DebitNotesService } from './debit-notes.service';
import { CreateDebitNoteDto } from './dto/create-debit-note.dto';

@Controller('debit-notes')
export class DebitNotesController {
  constructor(private readonly debitNotesService: DebitNotesService) {}

  @RequirePermissions('purchases.read')
  @Get()
  findAll() {
    return this.debitNotesService.findAll();
  }

  @RequirePermissions('purchases.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debitNotesService.findOneOrFail(id);
  }

  @RequirePermissions('purchases.write')
  @Post()
  create(@Body() dto: CreateDebitNoteDto) {
    return this.debitNotesService.createDebitNote(dto);
  }
}
