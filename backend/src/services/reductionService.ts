import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Between, Repository } from 'typeorm';
import { ErrorCodes } from '../constants/errorCodes';
import { Messages } from '../constants/messages';
import { ReductionUnit } from '../constants/reduction';
import { ReductionRecord } from '../models/reductionRecord';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

export interface ReductionInput {
  measure: string;
  reductionValue: number;
  unit: string;
  recordDate: string;
}

@Injectable()
export class ReductionService {
  constructor(
    @InjectRepository(ReductionRecord) private readonly reductionRepo: Repository<ReductionRecord>
  ) {}

  async list(userId: number, start?: string, end?: string) {
    logTemplate('info', 'REDUCTION_LIST_START');
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
    const normalized = this.normalizeInput(input);
    await this.ensureUnitValid(normalized.unit, 0);
    const duplicate = await this.findDuplicate(userId, normalized.measure, normalized.recordDate);
    if (duplicate) {
      logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id: duplicate.id, field: 'ReductionRecord.measure', reason: 'duplicate user/date/measure' });
      throw new AppError(
        ErrorCodes.REDUCTION_DUPLICATE,
        `ReductionRecord[id=${duplicate.id}] create failed: measure ${normalized.measure} already registered on ${normalized.recordDate}`,
        HttpStatus.CONFLICT
      );
    }
    const record = this.reductionRepo.create({
      userId,
      measure: normalized.measure,
      reductionValue: normalized.reductionValue,
      unit: normalized.unit,
      recordDate: normalized.recordDate
    });
    const saved = await this.saveOrThrowDuplicate(record, normalized.measure, normalized.recordDate, 0);
    logTemplate('info', 'REDUCTION_CREATE_SUCCESS', { id: saved.id, reductionValue: saved.reductionValue, unit: saved.unit });
    return { message: Messages.REDUCTION_CREATED, reduction: saved };
  }

  async update(userId: number, id: number, input: Partial<ReductionInput>) {
    logTemplate('info', 'REDUCTION_UPDATE_START', { id, fields: Object.keys(input).join(',') });
    const record = await this.reductionRepo.findOne({ where: { id, userId } });
    if (!record) {
      logTemplate('warn', 'REDUCTION_UPDATE_FAILED', { id, field: 'ReductionRecord.id', reason: 'not found' });
      throw new AppError(ErrorCodes.REDUCTION_NOT_FOUND, `ReductionRecord[id=${id}] update failed: id not found`, HttpStatus.NOT_FOUND);
    }
    const measure = input.measure !== undefined ? this.normalizeMeasure(input.measure) : record.measure;
    const recordDate = input.recordDate !== undefined ? this.normalizeDate(input.recordDate, id) : record.recordDate;
    const unit = input.unit ?? record.unit;
    if (input.unit !== undefined) {
      await this.ensureUnitValid(unit, id);
    }
    const duplicate = await this.findDuplicate(userId, measure, recordDate, id);
    if (duplicate) {
      logTemplate('warn', 'REDUCTION_UPDATE_FAILED', { id, field: 'ReductionRecord.measure', reason: 'duplicate user/date/measure' });
      throw new AppError(
        ErrorCodes.REDUCTION_DUPLICATE,
        `ReductionRecord[id=${id}] update failed: measure ${measure} already registered on ${recordDate}`,
        HttpStatus.CONFLICT
      );
    }
    record.measure = measure;
    record.unit = unit;
    record.recordDate = recordDate;
    if (input.reductionValue !== undefined) {
      record.reductionValue = this.normalizeValue(input.reductionValue, id);
    }
    const saved = await this.saveOrThrowDuplicate(record, measure, recordDate, id);
    logTemplate('info', 'REDUCTION_UPDATE_SUCCESS', { id: saved.id, recordDate: saved.recordDate, reductionValue: saved.reductionValue });
    return { message: Messages.REDUCTION_UPDATED, reduction: saved };
  }

  async remove(userId: number, id: number) {
    const record = await this.reductionRepo.findOne({ where: { id, userId } });
    if (!record) {
      throw new AppError(ErrorCodes.REDUCTION_NOT_FOUND, `ReductionRecord[id=${id}] delete failed: id not found`, HttpStatus.NOT_FOUND);
    }
    await this.reductionRepo.remove(record);
    logTemplate('info', 'REDUCTION_DELETE_SUCCESS', { id });
    return { message: Messages.REDUCTION_DELETED };
  }

  async total(userId: number, start: string, end: string) {
    const rows = await this.list(userId, start, end);
    const reduction = rows
      .filter((row) => row.unit === ReductionUnit.KG_CO2E)
      .reduce((sum, row) => sum + Number(row.reductionValue), 0);
    const totalReduction = Number(reduction.toFixed(2));
    logTemplate('info', 'REDUCTION_TOTAL_CALCULATED', { userId, start, end, reduction: totalReduction, net: '-' });
    return { totalReduction, rows };
  }

  private normalizeInput(input: ReductionInput) {
    const recordDate = this.normalizeDate(input.recordDate, 0);
    return {
      measure: this.normalizeMeasure(input.measure),
      recordDate,
      unit: (input.unit || '').trim(),
      reductionValue: this.normalizeValue(input.reductionValue, 0)
    };
  }

  private normalizeDate(value: string, id: number) {
    const parsed = dayjs(value);
    if (!value || !parsed.isValid()) {
      throw new AppError(
        ErrorCodes.VALIDATION_FAILED,
        `ReductionRecord[id=${id}] save failed: record_date ${value} invalid, expected YYYY-MM-DD`
      );
    }
    return parsed.format('YYYY-MM-DD');
  }

  private normalizeMeasure(measure: string) {
    const value = (measure || '').trim();
    if (!value) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `ReductionRecord[id=0] create failed: measure must not be empty`);
    }
    return value.slice(0, 128);
  }

  private normalizeValue(value: number, id: number) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_FAILED,
        `ReductionRecord[id=${id}] save failed: reduction_value must be a positive number`
      );
    }
    return String(Number(numberValue.toFixed(2)));
  }

  private async ensureUnitValid(unit: string, id: number) {
    if (!Object.values(ReductionUnit).includes(unit as ReductionUnit)) {
      logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id, field: 'ReductionRecord.unit', reason: 'invalid unit' });
      throw new AppError(
        ErrorCodes.REDUCTION_UNIT_INVALID,
        `ReductionRecord[id=${id}] save failed: unit ${unit} invalid, expected ${Object.values(ReductionUnit).join('|')}`
      );
    }
  }

  private async findDuplicate(userId: number, measure: string, recordDate: string, excludeId?: number) {
    const rows = await this.reductionRepo.find({ where: { userId, measure, recordDate } });
    return rows.find((row) => Number(row.id) !== Number(excludeId ?? -1)) || null;
  }

  private async saveOrThrowDuplicate(record: ReductionRecord, measure: string, recordDate: string, id: number) {
    try {
      return await this.reductionRepo.save(record);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        logTemplate('warn', 'REDUCTION_CREATE_FAILED', { id, field: 'ReductionRecord.measure', reason: 'unique key uk_reduction_user_date_measure' });
        throw new AppError(
          ErrorCodes.REDUCTION_DUPLICATE,
          `ReductionRecord[id=${id}] save failed: measure ${measure} already registered on ${recordDate}`,
          HttpStatus.CONFLICT
        );
      }
      throw error;
    }
  }
}
