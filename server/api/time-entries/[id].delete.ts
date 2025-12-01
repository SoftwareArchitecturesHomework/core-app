import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const timeEntryId = getRouterParam(event, 'id')

  if (!timeEntryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Time entry ID is required',
    })
  }

  const id = Number.parseInt(timeEntryId)

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid time entry ID',
    })
  }

  try {
    // Get the time entry to verify ownership
    const timeEntry = await getTimeEntryById(id)

    if (!timeEntry) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Time entry not found',
      })
    }

    // Check if the current user is the creator of the time entry
    if (timeEntry.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own time entries',
      })
    }

    // Delete the time entry
    await deleteTimeEntry(id)

    return {
      success: true,
      message: 'Time entry deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting time entry:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete time entry',
    })
  }
})
