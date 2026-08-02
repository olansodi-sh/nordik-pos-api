import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditNote } from './entities/credit-note.entity';
import { CreditNotesService } from './credit-notes.service';
import { CreditNotesController } from './credit-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CreditNote])],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
  exports: [CreditNotesService, TypeOrmModule],
})
export class CreditNotesModule {}
