import { getServerSession } from '#auth'
import { getUsersForTimeAdministration } from '~~/server/repositories/userRepository'
import {
  getWorkingDaysInMonth,
  getWorkingDaysInRange,
} from '~~/server/utils/date-utils'

type TimeAdministrationResponse = {
  id: number
  name: string
  email: string
  image: string | null
  administeredHours: number
  requiredHours: number
  vacationDays: number
  difference: number
  status: 'sufficient' | 'insufficient' | 'none'
}[]

export default defineEventHandler(
  async (event): Promise<TimeAdministrationResponse> => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Check if user is a manager
    if (user.role !== 'MANAGER') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only managers can access time administration',
      })
    }

    const query = getQuery(event)
    const year = Number(query.year)
    const month = Number(query.month)

    if (!year || !month || month < 1 || month > 12) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid year and month (1-12) are required',
      })
    }

    try {
      // Get start and end dates for the month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      // Calculate total working days for the month
      const totalWorkingDays = getWorkingDaysInMonth(year, month)

      // Get employees (for managers, get their direct reports)
      const employees = await getUsersForTimeAdministration(
        user.id,
        startDate,
        endDate,
      )
      const employeeData = employees.map((employee) => {
        // Calculate administered hours
        const administeredHours = employee.timeEntries.reduce(
          (sum, entry) => sum + entry.hours,
          0,
        )

        // Calculate vacation days within the month
        const vacationDays = employee.tasks.reduce((total, vacation) => {
          if (!vacation.startDate || !vacation.endDate) return total

          return (
            total +
            getWorkingDaysInRange(
              vacation.startDate,
              vacation.endDate,
              startDate,
              endDate,
            )
          )
        }, 0)

        // Calculate required hours accounting for vacation
        const requiredHours = (totalWorkingDays - vacationDays) * 8
        const difference = administeredHours - requiredHours

        return {
          id: employee.id,
          name: employee.name || 'Unknown',
          email: employee.email || '',
          image: employee.image,
          administeredHours: Math.round(administeredHours * 100) / 100,
          requiredHours: Math.round(requiredHours * 100) / 100,
          vacationDays,
          difference: Math.round(difference * 100) / 100,
          status: (administeredHours >= requiredHours
            ? 'sufficient'
            : administeredHours > 0
            ? 'insufficient'
            : 'none') as 'sufficient' | 'insufficient' | 'none',
        }
      })

      return employeeData
    } catch (error) {
      console.error('Error fetching time administration:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch time administration data',
      })
    }
  },
)
