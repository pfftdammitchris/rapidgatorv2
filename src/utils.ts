export interface SerializedError {
  name?: string
  message?: string
  stack?: string
}

export function createError(
  arg1: string | Error | SerializedError,
  arg2?: string | Pick<SerializedError, 'name' | 'message'>,
) {
  let name = ''
  let message = ''
  let stack = ''

  if (typeof arg1 === 'string') {
    if (typeof arg2 === 'string') {
      name = arg1
      message = arg2
    } else {
      message = arg1
    }
  } else if (arg1 instanceof Error) {
    name = arg1.name
    message = arg1.message
    stack = arg1.stack
  } else if (arg1 !== null && typeof arg1 === 'object') {
    name = arg1.name || ''
    message = arg1.message || ''
    stack = arg1.stack || ''
  }

  if (!name) {
    name = 'Error'
  }

  const error = new Error(message)
  error.name = name
  error.stack = stack || error.stack

  return error
}
