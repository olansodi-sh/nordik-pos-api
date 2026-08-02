import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @RequirePermissions('credit_notes.write')
  @Get()
  findAll() {
    return this.creditNotesService.findAll();
  }

  @RequirePermissions('credit_notes.write')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditNotesService.findOneOrFail(id);
  }

  @RequirePermissions('credit_notes.write')
  @Post()
  create(@Body() dto: CreateCreditNoteDto) {
    return this.creditNotesService.createCreditNote(dto);
  }
}
