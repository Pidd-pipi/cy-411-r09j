export enum ReductionUnit {
  KG_CO2E = 'kg CO2e'
}

export const REDUCTION_UNIT_LABELS: Record<ReductionUnit, string> = {
  [ReductionUnit.KG_CO2E]: 'kg CO2e（千克二氧化碳当量）'
};
