import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateManagedTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  getAccessibleTenants(
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tenantsService.getAccessibleTenants(userId, tenantId);
  }

  @Get('children')
  getChildTenants(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getChildTenants(tenantId);
  }

  @Post()
  createManagedTenant(
    @Body() dto: CreateManagedTenantDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tenantsService.createManagedTenant(dto, userId, tenantId);
  }

  @Get('consolidated')
  getConsolidatedDashboard(
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tenantsService.getConsolidatedDashboard(userId, tenantId);
  }
}
