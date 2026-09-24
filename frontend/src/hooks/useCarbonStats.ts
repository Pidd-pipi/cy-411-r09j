import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Activity, ReductionRecord } from '../types/entities';

export interface CarbonTrendPoint {
  date: string;
  gross: number;
  reduction: number;
  net: number;
  category?: string;
  value: number;
}

export function useCarbonStats(rows: Activity[], reductions: ReductionRecord[] = []) {
  return useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const inRange = (date: string, start: dayjs.Dayjs) => {
      const current = dayjs(date);
      return (current.isAfter(start) || current.isSame(start, 'day')) && !current.isAfter(dayjs(), 'day');
    };
    const grossToday = rows.filter((row) => row.recordDate === today).reduce((sum, row) => sum + Number(row.carbonValue), 0);
    const grossWeek = rows.filter((row) => inRange(row.recordDate, dayjs().startOf('week'))).reduce((sum, row) => sum + Number(row.carbonValue), 0);
    const grossMonth = rows.filter((row) => inRange(row.recordDate, dayjs().startOf('month'))).reduce((sum, row) => sum + Number(row.carbonValue), 0);
    const sumReduction = (list: ReductionRecord[]) => list.reduce((sum, row) => sum + Number(row.reductionValue), 0);
    const reductionToday = sumReduction(reductions.filter((row) => row.recordDate === today));
    const reductionWeek = sumReduction(reductions.filter((row) => inRange(row.recordDate, dayjs().startOf('week'))));
    const reductionMonth = sumReduction(reductions.filter((row) => inRange(row.recordDate, dayjs().startOf('month'))));
    const allDates = Array.from(new Set([...rows.map((row) => row.recordDate), ...reductions.map((row) => row.recordDate)])).sort();
    const trend: CarbonTrendPoint[] = allDates.map((date) => {
      const gross = Number(rows.filter((row) => row.recordDate === date).reduce((sum, row) => sum + Number(row.carbonValue), 0).toFixed(2));
      const dateReduction = sumReduction(reductions.filter((item) => item.recordDate === date));
      const categoryRow = rows.find((row) => row.recordDate === date);
      return {
        date,
        category: categoryRow?.category,
        value: gross,
        gross,
        reduction: Number(dateReduction.toFixed(2)),
        net: Number(Math.max(0, gross - dateReduction).toFixed(2))
      };
    });
    const toNet = (gross: number, reduction: number) => Number(Math.max(0, gross - reduction).toFixed(2));
    return {
      today: { gross: Number(grossToday.toFixed(2)), reduction: Number(reductionToday.toFixed(2)), net: toNet(grossToday, reductionToday) },
      week: { gross: Number(grossWeek.toFixed(2)), reduction: Number(reductionWeek.toFixed(2)), net: toNet(grossWeek, reductionWeek) },
      month: { gross: Number(grossMonth.toFixed(2)), reduction: Number(reductionMonth.toFixed(2)), net: toNet(grossMonth, reductionMonth) },
      todayTotal: Number(grossToday.toFixed(2)),
      weekTotal: Number(grossWeek.toFixed(2)),
      monthTotal: Number(grossMonth.toFixed(2)),
      trend
    };
  }, [rows, reductions]);
}
