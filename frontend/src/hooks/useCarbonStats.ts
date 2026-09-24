import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Activity, Reduction } from '../types/entities';

export interface PeriodCarbonStat {
  gross: number;
  reduction: number;
  net: number;
}

const round2 = (value: number) => Number(value.toFixed(2));

export function useCarbonStats(rows: Activity[], reductions: Reduction[] = []) {
  return useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const weekStart = dayjs().startOf('week');
    const monthStart = dayjs().startOf('month');
    const inWeek = (date: string) => dayjs(date).isAfter(weekStart.subtract(1, 'day'));
    const inMonth = (date: string) => dayjs(date).isAfter(monthStart.subtract(1, 'day'));
    const sumCarbon = (list: Activity[]) => list.reduce((sum, row) => sum + Number(row.carbonValue), 0);
    const sumReduction = (list: Reduction[]) => list.reduce((sum, row) => sum + Number(row.reductionValue), 0);
    const buildPeriod = (activities: Activity[], registered: Reduction[]): PeriodCarbonStat => {
      const gross = round2(sumCarbon(activities));
      const reduction = round2(sumReduction(registered));
      return { gross, reduction, net: round2(gross - reduction) };
    };
    const todayTotal = round2(sumCarbon(rows.filter((row) => row.recordDate === today)));
    const weekTotal = round2(sumCarbon(rows.filter((row) => inWeek(row.recordDate))));
    const monthTotal = round2(sumCarbon(rows.filter((row) => inMonth(row.recordDate))));
    const hasReductions = reductions.length > 0;
    const trend = hasReductions
      ? (() => {
          const grossByDate = new Map<string, number>();
          rows.forEach((row) => grossByDate.set(row.recordDate, round2((grossByDate.get(row.recordDate) || 0) + Number(row.carbonValue))));
          const reductionByDate = new Map<string, number>();
          reductions.forEach((row) => reductionByDate.set(row.recordDate, round2((reductionByDate.get(row.recordDate) || 0) + Number(row.reductionValue))));
          const dates = Array.from(new Set([...grossByDate.keys(), ...reductionByDate.keys()])).sort();
          return dates.map((date) => {
            const gross = grossByDate.get(date) || 0;
            const reduction = reductionByDate.get(date) || 0;
            return { date, value: gross, reduction, net: round2(gross - reduction) };
          });
        })()
      : rows
          .slice()
          .sort((a, b) => a.recordDate.localeCompare(b.recordDate))
          .map((row) => ({ date: row.recordDate, value: Number(row.carbonValue), category: row.category }));
    return {
      todayTotal,
      weekTotal,
      monthTotal,
      hasReductions,
      today: buildPeriod(rows.filter((row) => row.recordDate === today), reductions.filter((row) => row.recordDate === today)),
      week: buildPeriod(rows.filter((row) => inWeek(row.recordDate)), reductions.filter((row) => inWeek(row.recordDate))),
      month: buildPeriod(rows.filter((row) => inMonth(row.recordDate)), reductions.filter((row) => inMonth(row.recordDate))),
      trend
    };
  }, [rows, reductions]);
}
