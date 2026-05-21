export function calculateOptimalSendHour(reminders: {
  sent_at: string | Date
  read_at?: string | Date
  responded_at?: string | Date
}[]): number {
  if (reminders.length < 10) return 10

  const hourResponses: Record<number, number> = {}
  for (let h = 6; h <= 22; h++) hourResponses[h] = 0

  for (const reminder of reminders) {
    if (reminder.responded_at || reminder.read_at) {
      const responseTime = new Date(reminder.responded_at || reminder.read_at!)
      const hour = responseTime.getHours()
      if (hour >= 6 && hour <= 22) {
        hourResponses[hour]++
      }
    }
  }

  let maxHour = 10
  let maxCount = 0
  for (const [hour, count] of Object.entries(hourResponses)) {
    if (count > maxCount) {
      maxCount = count
      maxHour = parseInt(hour)
    }
  }

  return maxHour
}
