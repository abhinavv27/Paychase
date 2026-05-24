export interface HealthScoreInput {
  dso: number
  recoveryRate: number
  highRiskOutstanding: number
  totalOutstanding: number
  approvalRate: number
  collectionVelocity: number
}

export interface HealthScoreResult {
  score: number
  breakdown: { dso: number; recovery: number; concentration: number; approval: number; velocity: number }
  level: 'healthy' | 'moderate' | 'critical'
}

export function calculateCollectionHealth(input: HealthScoreInput): HealthScoreResult {
  const dsoScore = Math.max(0, Math.min(30, 30 * (1 - Math.max(0, input.dso - 15) / 45)))
  const recoveryScore = (input.recoveryRate / 100) * 25

  const atRiskPct = input.totalOutstanding > 0 ? input.highRiskOutstanding / input.totalOutstanding : 0
  const concentrationScore = Math.max(0, 20 * (1 - Math.max(0, atRiskPct - 0.1) / 0.4))

  const approvalScore = Math.min(15, (input.approvalRate / 100) * 15)
  const velocityScore = Math.max(0, Math.min(10, 10 * (1 - Math.max(0, input.collectionVelocity - 15) / 45)))

  const score = Math.round(dsoScore + recoveryScore + concentrationScore + approvalScore + velocityScore)
  const level = score >= 70 ? 'healthy' : score >= 40 ? 'moderate' : 'critical'

  return {
    score, level,
    breakdown: { dso: dsoScore, recovery: recoveryScore, concentration: concentrationScore, approval: approvalScore, velocity: velocityScore }
  }
}
