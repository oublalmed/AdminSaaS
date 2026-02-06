import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, AiGenerateReminderDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Post()
  create(
    @Body() dto: CreateReminderDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.remindersService.create(dto, userId, tenantId);
  }

  @Post('ai-generate')
  aiGenerate(
    @Body() dto: AiGenerateReminderDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.remindersService.aiGenerateReminder(dto, userId, tenantId);
  }

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.remindersService.findAll(tenantId, status);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.remindersService.findOne(id, tenantId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.remindersService.delete(id, tenantId);
  }
}
