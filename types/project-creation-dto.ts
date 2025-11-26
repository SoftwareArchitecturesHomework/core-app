import type { DateValue } from '@internationalized/date'


export interface ProjectCreationDto {
    projectName: string
    startDate: Date
    plannedEndDate: Date | null
}