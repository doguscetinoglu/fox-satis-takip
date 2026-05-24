export type PlanStatusValue = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export function getEffectivePlanStatus(tenant: {
  planStatus: PlanStatusValue
  trialEndsAt: Date
  subscriptionEndsAt: Date | null
}): PlanStatusValue {
  if (tenant.planStatus === 'TRIAL' && new Date() > new Date(tenant.trialEndsAt)) {
    return 'SUSPENDED'
  }
  if (
    tenant.planStatus === 'ACTIVE' &&
    tenant.subscriptionEndsAt &&
    new Date() > new Date(tenant.subscriptionEndsAt)
  ) {
    return 'SUSPENDED'
  }
  return tenant.planStatus
}

export function getTrialDaysRemaining(trialEndsAt: Date): number {
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
}

export function getTrialUrgency(daysRemaining: number): 'safe' | 'warning' | 'critical' {
  if (daysRemaining > 4) return 'safe'
  if (daysRemaining >= 2) return 'warning'
  return 'critical'
}
