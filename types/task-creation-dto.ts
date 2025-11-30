import * as string_decoder from "node:string_decoder";

export interface TaskCreationDto {
    type:string
    name:string | null
    description:string | null
    projectName: string | null
    startDate: string
    endDate: string
}