export type UserDropdownOption = {
  label: string
  value: number
  email: string
  avatar: {
    src: string
  }
}

export type SerializedUser = {
  id: number
  role: string
  name: string | null
  email: string | null
  image: string | null
}
