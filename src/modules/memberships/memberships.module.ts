import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTenantMembership } from './entities/user-tenant-membership.entity';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserTenantMembership])],
  providers: [MembershipsService],
  exports: [MembershipsService, TypeOrmModule],
})
export class MembershipsModule {}
