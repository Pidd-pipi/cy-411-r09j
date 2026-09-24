export enum ReductionUnit {
  KG_CO2E = 'kg CO2e'
}

export const REDUCTION_UNIT_LABELS: Record<ReductionUnit, string> = {
  [ReductionUnit.KG_CO2E]: '千克二氧化碳当量'
};

export const REDUCTION_RECORD_ERROR_FIELDS = {
  MEASURE: 'ReductionRecord.measure',
  REDUCTION_VALUE: 'ReductionRecord.reduction_value',
  UNIT: 'ReductionRecord.unit',
  RECORD_DATE: 'ReductionRecord.record_date'
};
