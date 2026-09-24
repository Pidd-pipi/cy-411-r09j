import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCodes } from '../constants/errorCodes';
import { RequireAuth } from '../middlewares/auth';
import { ReductionInput, ReductionService } from '../services/reductionService';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

@Controller('reductions')
@UseGuards(RequireAuth)
export class ReductionController {
  constructor(private readonly reductionService: ReductionService) {}

  @Get()
  list(@Req() request: Request, @Query('start') start?: string, @Query('end') end?: string) {
    return this.reductionService.list(request.user!.id, start, end);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: ReductionInput) {
    request.auditEntity = 'ReductionRecord';
    request.auditAction = 'ReductionRecord create';
    try {
      return await this.reductionService.create(request.user!.id, body);
    } catch (error: any) {
      logTemplate('error', 'REDUCTION_CREATE_FAILED', { id: 0, field: 'ReductionRecord.measure', reason: error.message });
      throw new AppError(
        error.code || ErrorCodes.VALIDATION_FAILED,
        `ReductionRecord[id=0] controller create failed: measure ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':id')
  async update(@Req() request: Request, @Param('id') id: string, @Body() body: Partial<ReductionInput>) {
    request.auditEntity = 'ReductionRecord';
    request.auditEntityId = Number(id);
    request.auditAction = 'ReductionRecord update';
    try {
      return await this.reductionService.update(request.user!.id, Number(id), body);
    } catch (error: any) {
      logTemplate('error', 'REDUCTION_UPDATE_FAILED', { id, field: 'ReductionRecord.id', reason: error.message });
      throw new AppError(
        error.code || ErrorCodes.DATABASE_FAILED,
        `ReductionRecord[id=${id}] controller update failed: id ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string) {
    request.auditEntity = 'ReductionRecord';
    request.auditEntityId = Number(id);
    request.auditAction = 'ReductionRecord delete';
    return this.reductionService.remove(request.user!.id, Number(id));
  }

  @Get('summary')
  summary(@Req() request: Request, @Query('start') start: string, @Query('end') end: string) {
    return this.reductionService.total(request.user!.id, start, end);
  }
}
