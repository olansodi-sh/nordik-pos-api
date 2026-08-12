import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldsController } from './custom-fields.controller';

@Module({
  imports: [TenantOrmModule.forFeature([CustomFieldDefinition])],
  controllers: [CustomFieldsController],
  providers: [CustomFieldsService],
  exports: [CustomFieldsService, TenantOrmModule],
})
export class CustomFieldsModule {}
