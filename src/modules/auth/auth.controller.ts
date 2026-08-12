import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('select-tenant')
  selectTenant(
    @Body() dto: SelectTenantDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.selectTenant(currentUser.userId, dto.businessId);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('my-memberships')
  myMemberships(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.myMemberships(user.userId);
  }
}
