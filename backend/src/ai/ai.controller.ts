import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    const response = await this.aiService.chat(dto.message, dto.context);
    return { response };
  }
}
