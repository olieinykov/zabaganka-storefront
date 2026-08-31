import crypto from "node:crypto"

export function verifyMonoSignature(params: {
  rawBody: Buffer | string
  signatureBase64: string
  publicKeyBase64: string
}): boolean {
  const { rawBody, signatureBase64, publicKeyBase64 } = params

  if (!signatureBase64 || !publicKeyBase64) {
    return false
  }

  try {
    const publicKeyPem = Buffer.from(publicKeyBase64, "base64")
    const signature = Buffer.from(signatureBase64, "base64")
    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8")

    const verifier = crypto.createVerify("SHA256")
    verifier.update(body)
    verifier.end()

    return verifier.verify(publicKeyPem, signature)
  } catch {
    return false
  }
}
