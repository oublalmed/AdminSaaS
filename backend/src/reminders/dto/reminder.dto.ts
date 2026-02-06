import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ReminderChannel } from '@prisma/client';

export class CreateReminderDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsEnum(ReminderChannel)
  channel: ReminderChannel;

  @IsOptional()
  @IsString()
  message?: string;

  @IsDateString()
  scheduledAt: string;
}

export class AiGenerateReminderDto {
  @IsString()
  clientId: string;

  @IsString()
  invoiceId: string;

  @IsEnum(ReminderChannel)
  channel: ReminderChannel;

  @IsOptional()
  @IsString()
  language?: string;
}
