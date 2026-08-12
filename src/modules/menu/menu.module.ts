import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { MenuAccessRule } from './entities/menu-access-rule.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuAccessRule]), MembershipsModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService, TypeOrmModule],
})
export class MenuModule {}
