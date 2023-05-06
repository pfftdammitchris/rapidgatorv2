import type { LiteralUnion, Promisable } from 'type-fest'
import type { Rapidgator } from './rapidgatorv2'
import * as c from './constants'

/**
 * Response details as a member of the {@link Response} object.
 */
export type ResponseDetails = LiteralUnion<ResponseErrorMessage, string>

/**
 * Error messages that can be returned by different APIs.
 */
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

/**
 * The state label for a {@link Response}
 */
export type ResponseStateLabel = LiteralUnion<
  'Activated' | 'Done' | 'Uploading',
  string
>

/**
 * The mode label representing a mode state.
 */
export type ResponseModeLabel = LiteralUnion<'Premium Only', string>

/**
 * The status code received in a response for an http request.
 */
export type ResponseStatusCode = LiteralUnion<200 | 401, number>

/**
 * The response object returned from each endpoint.
 */
export type Response<R = any> = {
  response: R
  status: ResponseStatusCode
  details?: null | ResponseDetails
}

/**
 * The mode label
 */
export type ModeLabel = 'Public' | 'Premium Only' | 'Private' | 'Hotlink'

/**
 * The user object profile.
 */
export interface UserObject {
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

/**
 * The link object returned as a generated result for APIs such as {@link Rapidgator.createOneTimeLink}
 */
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

/**
 * The file object returned when working with files such as {@link Rapidgator.createFolder}
 */
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

/**
 * The folder object returned when working with folders such as {@link Rapidgator.createFolder}
 */
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
