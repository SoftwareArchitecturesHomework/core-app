import * as string_decoder from "node:string_decoder";

export interface EventCreationDto {
    type:string
    name:string | null
    description:string | null
    projectId: number | null
    startDate: string
    endDate: string
    participantIds: []
    taskId: number | null
}