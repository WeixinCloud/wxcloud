function serialize(error: Error) {
  if (error.stack) {
    return error.stack;
  }
  return error.message;
}

export function serializeError(error: Error) {
  let message = serialize(error);
  if ('cause' in error) {
    message += `\n\n原因：${serialize((error as any).cause)}`;
  }
  return new Error(message);
}
