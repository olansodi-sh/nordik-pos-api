import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { RbacService } from './rbac.service';
import { RolesService } from './roles.service';
import { RbacController } from './rbac.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [RbacController],
  providers: [RbacService, RolesService],
  exports: [RbacService, RolesService, TypeOrmModule],
})
export class RbacModule {}
