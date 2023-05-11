import axios from 'axios'
import path from 'path'
import fs from 'node:fs'
// import FormData from 'form-data'
import md5 from 'md5'
import md5File from 'md5-file'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { LiteralUnion } from 'type-fest'
import * as util from './utils'
import * as c from './constants'
import type * as t from './types'

export class Rapidgator {
  #password: string
  #token: string
  #req: AxiosInstance
  #requestConfig: AxiosRequestConfig
  username: string

  static baseURL = 'https://rapidgator.net'

  constructor(username: string, password: string) {
    this.username = username
    this.#password = password
    this.#token = ''
    this.#requestConfig = { baseURL: Rapidgator.baseURL }

    if (!this.username) {
      throw new Error(`Username cannot be empty`)
    }

    if (!this.#password) {
      throw new Error(`Password cannot be empty`)
    }

    this.#req = axios.create(this.#requestConfig)
  }

  #createURL = (pathname: string) => `${Rapidgator.baseURL}${pathname}`

  get requestConfig() {
    return this.#requestConfig
  }

  set requestConfig(requestConfig) {
    this.#requestConfig = requestConfig
  }

  /**
   * Logs in to the rapidgator api in exchange for an access token along with the {@link t.UserObject}.
   * An access token is required for most API endpoints.
   */
  async login() {
    const url = this.#createURL('/api/v2/user/login')

    const response = await this.#req.get<
      t.Response<{ token: string; user: t.UserObject }>
    >(url, {
      ...this.#requestConfig,
      params: {
        login: this.username,
        password: this.#password,
      },
    })

    this.#token = response.data?.response?.token || ''
    this.#req.defaults.params = {
      ...this.#req.defaults.params,
      token: this.#token,
    }

    return response.data
  }

  /**
   * Retrieves the {@link t.UserObject}
   */
  async getProfile() {
    const url = this.#createURL('/api/v2/user/info')
    return (
      await this.#req.get<t.Response<{ user: t.UserObject }>>(url, {
        ...this.#requestConfig,
        params: {
          token: this.#token,
        },
      })
    ).data
  }

  /**
   * Checks if an instant upload is possible and returns the upload session object with its file info or upload url.
   * @param options
   */
  async upload(options: {
    name: string
    data?: Buffer
    filepath?: string
    folderId?: number
    multipart?: boolean | string
  }) {
    let { name, data, filepath, folderId, multipart } = options

    if (!name) {
      throw util.createError(`name cannot be empty`)
    }

    if (!data && !filepath) {
      throw util.createError(`data and filepath cannot both be empty`)
    }

    if (!this.#token) {
      throw util.createError(`You are not logged in.`)
    }

    if (folderId === undefined) {
      folderId = 1
    }

    const url = this.#createURL('/api/v2/file/upload')
    const params = { name, folder_id: folderId } as {
      folder_id: string | number
      name: string
      hash: string
      size: number
      multipart?: string | boolean
    }

    if (multipart) {
      params.multipart = multipart
    }

    if (filepath) {
      params.hash = await md5File(filepath)
      params.size = fs.statSync(filepath).size
    } else if (data) {
      params.hash = md5(data)
      params.size = data.byteLength
    }
  }

  #prepareUpload = async ({
    filepath = '',
    data,
    folderId,
  }: {
    filepath?: string
    data?: Buffer
    folderId?: number
    multipart?: true | string
  }) => {
    let hash = ''
    let size = 0
    let filename = path.basename(filepath)

    if (filepath) {
      hash = await md5File(filepath)
      size = fs.statSync(filepath).size
    } else if (data) {
      hash = md5(data)
      size = data.byteLength
    }

    const params = {
      hash,
      name: filename,
      size,
      token: this.#token,
    } as any

    if (folderId !== undefined) {
      params.folder_id = folderId
    }

    const url = this.#createURL(`/api/v2/file/upload`)

    const response = await this.#req.get<
      t.Response<{
        upload: {
          upload_id: string
          url: string
          file: t.FileObject[]
          state: c.FileState
          state_label: 'Uploading'
        }
      }>
    >(url, {
      ...this.#requestConfig,
      params,
    })

    return response.data
  }

  /**
   *
   * @param uploadId The ID of a file upload.
   */
  async getFileUploadSessionState(uploadId: string) {
    const url = this.#createURL('/api/v2/file/check_link')
    const params = { upload_id: uploadId }
    return (
      await this.#req.get<
        t.Response<{
          upload: {
            upload_id: string
            url: string
            file: t.FileObject | t.FileObject[]
            state: number
            state_label: LiteralUnion<
              'Uploading' | 'Processing' | 'Done' | 'Fail',
              string
            >
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /* -------------------------------------------------------
    ---- FILES
  -------------------------------------------------------- */

  /**
   * Checks a file's download url/link.
   * @param fileURL The url/download link of the {@link t.FileObject}
   */
  async checkFileLink(fileURL: string) {
    const url = this.#createURL('/api/v2/file/check_link')
    const params = { url: fileURL }
    return (
      await this.#req.get<
        t.Response<
          Array<{
            url: string
            filename?: string
            size?: Number
            status: 'ACCESS' | 'NO ACCESS'
          }>
        >
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Creates and returns a one-time {@link t.LinkObject}
   * @param fileId The ID of the {@link t.FileObject}
   * @param options Options to create the one-time link.
   */
  async createOneTimeLink(
    fileId: string,
    options?: {
      url?: string
      notify?: boolean
    },
  ) {
    const url = this.#createURL('/api/v2/file/onetimelink_create')
    const params = { file_id: fileId } as {
      file_id: string
      url?: string
      notify?: boolean
    }

    if (options) {
      if ('notify' in options) params.notify = options.notify
      if ('url' in options) params.url = options.url
    }

    return (
      await this.#req.get<t.Response<{ link: t.LinkObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Returns a one-time {@link t.LinkObject}'s download link info.
   * @param linkId The key that identifies the one-time link. You can also specify multiple link keys separated by comma. If linkId is not provided, this will return all one-time link details.
   */
  async getOneTimeLinkInfo(linkId?: string) {
    const url = this.#createURL('/api/v2/file/onetimelink_info')
    const params = {} as { link_id?: string }

    if (linkId) params.link_id = linkId

    return (
      await this.#req.get<
        t.Response<{
          links: (t.LinkObject | { link_id: string; error: 'Link not found' })[]
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Downloads a file.
   * @param fileId The ID of the {@link t.FileObject}
   */
  async downloadFile(fileId: string) {
    const url = this.#createURL('/api/v2/file/download')
    const params = { file_id: fileId }
    return (
      await this.#req.get<t.Response<{ download_url: string; delay: number }>>(
        url,
        { ...this.#requestConfig, params },
      )
    ).data
  }

  /**
   * Retrieves a file's info.
   * @param fileId The ID of the {@link t.FileObject}
   */
  async getFile(fileId: string) {
    const url = this.#createURL('/api/v2/file/info')
    const params = { file_id: fileId }
    return (
      await this.#req.get<t.Response<{ file: t.FileObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Removes a file.
   * @param fileId The ID of the {@link t.FileObject}
   */
  async removeFile(fileId: string) {
    const url = this.#createURL('/api/v2/file/delete')
    const params = { file_id: fileId }
    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Removes a file.
   * @param fileId The ID of the {@link t.FileObject}
   */
  async updateFileMode(fileId: string, mode: c.FileMode) {
    const url = this.#createURL('/api/v2/file/change_mode')
    const params = { file_id: fileId, mode }
    return (
      await this.#req.get<
        t.Response<{
          file: t.FileObject
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Renames a file.
   * @param fileId The ID of the {@link t.FileObject}
   * @param newFileName The file's new name.
   */
  async renameFile(fileId: string, newFileName: string) {
    const url = this.#createURL('/api/v2/file/rename')
    const params = { file_id: fileId, name: newFileName }
    return (
      await this.#req.get<t.Response<{ file: t.FileObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Copies a file to another folder.
   * @param fileId The ID of the {@link t.FileObject}
   * @param targetFolderId The target folder's ID.
   */
  async copyFile(fileId: string, targetFolderId: string) {
    const url = this.#createURL('/api/v2/file/copy')
    const params = { file_id: fileId, folder_id_dest: targetFolderId }
    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Copies a file to another folder by its {@link t.FileObject} ID or by its download link.
   * @param fileIdOrURL A {@link t.FileObject}'s ID or its download link
   * @param folderId A {@link t.FolderObject}'s ID
   */
  async copyFileByIdOrLink(fileIdOrURL: string, folderId: string) {
    const url = this.#createURL('/api/v2/file/xcopy')
    const params = { folder_id_dest: folderId } as {
      folder_id_dest: string
      file_id?: string
      url?: string
    }

    if (fileIdOrURL.startsWith('http')) {
      params.url = fileIdOrURL
    } else {
      params.file_id = fileIdOrURL
    }

    return (
      await this.#req.get<t.Response<{ file: t.FileObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Copies a file to another folder by its md5 hash.
   * @param hash The {@link t.FileObject}'s MD5 hash
   * @param filename The new name for the {@link t.FileObject}
   * @param folderId The ID of the target {@link t.FolderObject}
   */
  async copyFileByMd5Hash(hash: string, filename: string, folderId: string) {
    const url = this.#createURL('/api/v2/file/hashcopy')
    const params = { hash, name: filename, folder_id_dest: folderId }

    return (
      await this.#req.get<t.Response<{ file: t.FileObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Moves a file to another folder.
   * @param fileId The ID of the {@link t.FileObject}
   * @param targetFolderId The target folder's ID.
   */
  async moveFile(fileId: string, targetFolderId: string) {
    const url = this.#createURL('/api/v2/file/move')
    const params = { file_id: fileId, folder_id_dest: targetFolderId }
    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /* -------------------------------------------------------
    ---- FOLDERS
  -------------------------------------------------------- */

  /**
   * Returns a folder's info as well as its sub folders.
   * @param id The folder id.
   */
  async getFolder(id?: string) {
    const url = this.#createURL(`/api/v2/folder/info`)
    const params = {} as { folder_id?: string }
    if (id) params.folder_id = id
    return (
      await this.#req.get<t.Response<{ folder: t.FolderObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Returns a {@link t.FolderObject} including its sub folders.
   * @param options Options for retrieving the {@link t.FolderObject} and its sub folders.
   */
  async getFolderContent(options?: {
    folderId?: string
    filesPerPage?: number
    page?: number
    sortColumn?: 'created' | 'size' | 'name' | 'nb_downloads' // Default is 'name'
    sortDirection?: 'ASC' | 'DESC' // Default is 'ASC'
  }) {
    const url = this.#createURL(`/api/v2/folder/content`)
    const params = {} as {
      folder_id?: string
      page?: number
      per_page?: number
      sort_column?: typeof options.sortColumn
      sort_direction?: typeof options.sortDirection
    }

    if (options) {
      if ('folderId' in options) params.folder_id = options.folderId
      if ('filesPerPage' in options) params.per_page = options.filesPerPage
      if ('page' in options) params.page = options.page
      if ('sortColumn' in options) params.sort_column = options.sortColumn
      if ('sortDirection' in options) {
        params.sort_direction = options.sortDirection
      }
    }

    return (
      await this.#req.get<
        t.Response<{
          folder: t.FolderObject & { files: t.FileObject[] }
          pager: { current: number; total: number }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Creates a folder.
   * @param name The folder name.
   * @param folderId Optionally, the folder ID to create a new folder in.
   */
  async createFolder(name: string, folderId?: string) {
    const url = this.#createURL(`/api/v2/folder/create`)
    const params = { name } as { name: string; folder_id?: string }
    if (folderId) params.folder_id = folderId
    const response = await this.#req.get<
      t.Response<{
        folder: t.FolderObject
      }>
    >(url, {
      ...this.#requestConfig,
      params,
    })
    return response.data
  }

  /**
   * Removes a folder.
   * @param folderId The folder ID.
   */
  async removeFolder(folderId: string) {
    const url = this.#createURL(`/api/v2/folder/delete`)
    const params = { folder_id: folderId }
    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Renames a folder.
   * @param folderId The folder ID to rename.
   * @param newName The new name for the folder.
   */
  async renameFolder(folderId: string, newName: string) {
    const url = this.#createURL(`/api/v2/folder/rename`)
    const params = { name: newName, folder_id: folderId }
    return (
      await this.#req.get<t.Response<{ folder: t.FolderObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }

  /**
   * Copies a folder to another folder.
   * Note: This operation also works with foreign folders.
   * @param sourceFolderId Source folder ID.
   * @param targetFolderId Target folder ID.
   */
  async copyFolder(sourceFolderId: string | string[], targetFolderId: string) {
    const url = this.#createURL(`/api/v2/folder/copy`)
    const params = { folder_id: '', folder_id_dest: targetFolderId }

    if (Array.isArray(sourceFolderId)) {
      params.folder_id = sourceFolderId.join(',')
    } else {
      params.folder_id = sourceFolderId
    }

    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Moves a folder to another folder.
   * Note: This also works with foreign folders.
   * @param sourceFolderId A source folder ID or a list of folder IDs.
   * @param targetFolderId Target folder ID.
   */
  async moveFolder(sourceFolderId: string | string[], targetFolderId: string) {
    const url = this.#createURL(`/api/v2/folder/move`)
    const params = { folder_id_dest: targetFolderId } as {
      folder_id: string
      folder_id_dest: string
    }

    if (Array.isArray(sourceFolderId)) {
      params.folder_id = sourceFolderId.join(',')
    } else {
      params.folder_id = sourceFolderId
    }

    return (
      await this.#req.get<
        t.Response<{
          result: {
            success: number
            success_ids: string[]
            fail: number
            fail_ids: string[]
            errors: t.ResponseErrorMessage[]
          }
        }>
      >(url, { ...this.#requestConfig, params })
    ).data
  }

  /**
   * Changes a folder's mode.
   * @param folderId The folder ID.
   * @param mode The mode to update the folder with.
   */
  async updateFolderMode(folderId: string, mode: number) {
    const url = this.#createURL(`/api/v2/folder/change_mode`)
    const params = { folder_id: folderId, mode }
    return (
      await this.#req.get<t.Response<{ folder: t.FolderObject }>>(url, {
        ...this.#requestConfig,
        params,
      })
    ).data
  }
}
