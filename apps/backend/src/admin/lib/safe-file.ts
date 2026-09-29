export function toSafeFile(file: File): File {
  const extMatch = /\.[a-zA-Z0-9]+$/.exec(file.name)
  const ext = extMatch ? extMatch[0] : ""
  const safeName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}${ext}`

  return new File([file], safeName, {
    type: file.type,
    lastModified: file.lastModified,
  })
}
