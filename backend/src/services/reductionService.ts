import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Between, Not, Repository } from 'typeorm';
import { ErrorCodes } from '../constants/errorCodes';
import { Messages } from '../constants/messages';
import { Reduction } from '../models/reduction';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

export interface ReductionInput {
  measure: string;
  reductionValue: number;
  unit: string;
  recordDate: string;
  note?: string;
}

@Injectable()
export class ReductionService {
  constructor(@InjectRepository(Reduction) private readonly reductionRepo: Repository<Reduction>) {}

  async list(userId: number, start?: string, end?: string) {
    logTemplate('info', 'REDUCTION_LIST_START', { userId });
    return this.reductionRepo.find({
      where: {
        userId,
        ...(start && end ? { recordDate: Between(start, end) } : {})
      },
      order: { recordDate: 'DESC', id: 'DESC' }
    });
  }

  async create(userId: number, input: ReductionInput) {
    logTemplate('info', 'REDUCTION_CREATE_START', { userId, measure: input.measure, recordDate: input.recordDate });
    const recordDate = this.validateInput(0, input.measure, input.reductionValue, input.unit, input.recordDate);
    await this.ensureNoDuplicate(userId, recordDate, input.measure.trim(), 0);
    const reduction = this.reductionRepo.create({
      userId,
      measure: input.measure.trim(),
      reductionValue: String(input.reductionValue),
      unit: input.unit,
      recordDate,
      note: input.note || null
    });
    const saved = await this.reductionRepo.save(reduction);
    logTemplate('info', 'REDUCTION_CREATE_SUCCESS', { id: saved.id, reductionValue: saved.reductionValue });
    return { message: Messages.REDUCTION_CREATED, reduction: saved };
  }

  async update(userId: number, id: number, input: Partial<ReductionInput>) {
    logTemplate('info', 'REDUCTION_UPDATE_START', { id, fields: Object.keys(input).join(',') });
    const reduction = await this.reductionRepo.findOne({ where: { id, userId } });
    if (!reduction) {
      logTemplate('warn', 'REDUCTION_UPDATE_FAILED', { id, field: 'Reduction.id', reason: 'not found' });
      throw new AppError(ErrorCodes.REDUCTION_NOT_FOUND, `Reduction[id=${id}] update failed: id not found`, HttpStatus.NOT_FOUND);
    }
    const nextMeasure = input.measure !== undefined ? input.measure.trim() : reduction.measure;
    const nextValue = Number(input.reductionValue ?? reduction.reductionValue);
    const nextUnit = input.unit ?? reduction.unit;
    const nextDate = input.recordDate ? dayjs(input.recordDate).format('YYYY-MM-DD') : reduction.recordDate;
    this.validateInput(id, nextMeasure, nextValue, nextUnit, nextDate);
    await this.ensureNoDuplicate(userId, nextDate, nextMeasure, id);
    reduction.measure = nextMeasure;
    reduction.reductionValue = String(nextValue);
    reduction.unit = nextUnit;
    reduction.recordDate = nextDate;
    reduction.note = input.note ?? reduction.note;
    const saved = await this.reductionRepo.save(reduction);
    logTemplate('info', 'REDUCTION_UPDATE_SUCCESS', { id: saved.id, reductionValue: saved.reductionValue, recordDate: saved.recordDate });
    return { message: Messages.REDUCTION_UPDATED, reduction: saved };
  }

  async remove(userId: number, id: number) {
    const reduction = await this.reductionRepo.findOne({ where: { id, userId } });
    if (!reduction) {
      throw new AppError(ErrorCodes.REDUCTION_NOT_FOUND, `Reduction[id=${id}] delete failed: id not found`, HttpStatus.NOT_FOUND);
    }
    await this.reductionRepo.remove(reduction);
    logTemplate('info', 'REDUCTION_DELETE_SUCCESS', { id });
    return { message: Messages.REDUCTION_DELETED };
  }

  async summarize(userId: number, start: string, end: string) {
    const rows = await this.list(userId, start, end);
    const total = rows.reduce((sum, row) => sum + Number(row.reductionValue), 0);
    logTemplate('info', 'REDUCTION_SUMMARY_CALCULATED', { userId, total: Number(total.toFixed(2)), start, end });
    return { total: Number(total.toFixed(2)), rows };
  }

  private validateInput(id: number, measure: string, reductionValue: number, unit: string, recordDate: string) {
    if (!measure || !measure.trim()) {
      logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id, field: 'Reduction.measure', reason: 'empty measure' });
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `Reduction[id=${id}] validate failed: measure empty`);
    }
    const value = Number(reductionValue);
    if (!Number.isFinite(value) || value <= 0) {
      logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id, field: 'Reduction.reduction_value', reason: 'not positive' });
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `Reduction[id=${id}] validate failed: reduction_value must be positive`);
    }
    if (!unit) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `Reduction[id=${id}] validate failed: unit empty`);
    }
    if (!recordDate || !dayjs(recordDate).isValid()) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `Reduction[id=${id}] validate failed: record_date invalid`);
    }
    return dayjs(recordDate).format('YYYY-MM-DD');
  }

  private async ensureNoDuplicate(userId: number, recordDate: string, measure: string, excludeId: number) {
    const existing = await this.reductionRepo.findOne({
      where: { userId, recordDate, measure, ...(excludeId ? { id: Not(excludeId) } : {}) }
    });
    if (existing) {
      logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id: existing.id, field: 'Reduction.measure', reason: `duplicate on ${recordDate}` });
      throw new AppError(
        ErrorCodes.REDUCTION_DUPLICATE,
        `Reduction[id=${existing.id}] save failed: measure '${measure}' already registered on record_date=${recordDate}`,
        HttpStatus.CONFLICT
      );
    }
  }
}
