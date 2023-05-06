import type { LiteralUnion, Promisable } from 'type-fest'
import * as c from './constants'

export type ResponseDetails = LiteralUnion<ResponseErrorMessage, string>

export type ResponseErrorMessage =
  | 'Error: Login or password is wrong'
  | 'Error: Invalid auth code'
  | 'Error: Link not found'
  | 'Error: User not found'
  | 'Error: File not found'
  | 'Error: Failed to copy the file'
  | 'Error: Failed to delete the file'
  | 'Error: Failed to move the file'
  | 'Error: Failed to rename file'
  | "Error: You can't create more than 10 copies of the same file"
  | 'Error: Parent folder not found'
  | 'Error: Folder not found'
  | 'Error: Session not exist'

export type ResponseStateLabel = LiteralUnion<
  'Activated' | 'Done' | 'Uploading',
  string
>
export type ResponseModeLabel = LiteralUnion<'Premium Only', string>

export type ResponseStatusCode = LiteralUnion<200 | 401, number>

export type Response<R = any> = {
  response: R
  status: ResponseStatusCode
  details?: null | ResponseDetails
}

export type LoginResponse = Response<{
  token: string
  user: {
    email: string
    is_premium: boolean
    premium_end_time: null | string
    state: LiteralUnion<1, number>
    state_label: LiteralUnion<'Activated', string>
    traffic: {
      total: null | number
      left: null | number
    }
    storage: {
      total: string // '4398046511104'
      left: number // 4398035213138
    }
    upload: {
      max_file_size: number
      nb_pipes: number
    }
    remote_upload: {
      max_nb_jobs: number
      refresh_time: number
    }
  }
}>

export type GetProfileResponse = Response<
  Omit<LoginResponse['response'], 'token'>
>

export interface LinkObject {
  link_id: string
  file: FileObject
  url: string
  state: LiteralUnion<'0', string>
  state_label: LiteralUnion<'Waiting', string>
  callback_url: string
  notify: boolean
  created: number
  downloaded: boolean
}

export interface FileObject {
  file_id?: string
  folder_id?: string
  mode?: c.FileMode
  mode_label?: ModeLabel
  name?: string
  hash?: string
  size?: number
  created?: number
  url?: string
}

export interface FolderObject {
  folder_id?: string
  mode?: c.FileMode
  mode_label?: ModeLabel
  parent_folder_id?: string | null
  name?: LiteralUnion<'root', string>
  url?: string
  nb_folders?: LiteralUnion<'2', string>
  nb_files?: LiteralUnion<'1', string>
  size_files?: string | number // ex: '1959424' | 0
  created?: number // Timestamp
  folders?: FolderObject[]
}

export type ModeLabel = 'Public' | 'Premium Only' | 'Private' | 'Hotlink'
