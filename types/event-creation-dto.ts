export interface EventCreationDto {
  type: string
  name: string | null
  description: string | null
  projectId: number | null
  startDate: string
  endDate: string
  participantIds: number[]
  taskId: number | null
}
