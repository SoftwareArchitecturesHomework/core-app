
export function getWorkingDaysInMonth(year: number, month: number): number {
  const date = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= lastDay; day++) {
    date.setDate(day)
    const dayOfWeek = date.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
  }

  return workingDays
}

export function getWorkingDaysInRange(
  vacationStart: Date,
  vacationEnd: Date,
  monthStart: Date,
  monthEnd: Date
): number {
  // Get the overlapping period
  const start = vacationStart > monthStart ? vacationStart : monthStart
  const end = vacationEnd < monthEnd ? vacationEnd : monthEnd

  if (start > end) return 0

  let workingDays = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}