import _sodium from 'libsodium-wrappers'

export type Keys = {
  privateKey: Uint8Array
  publicKey: Uint8Array
}

let sodiumReady = false

export const createReceiverKey = async (keys: Keys, senderPublicKey: Uint8Array) => {
  if (!sodiumReady) {
    await _sodium.ready
    sodiumReady = true
  }
  const sodium = _sodium
  return sodium.crypto_kx_server_session_keys(keys.publicKey, keys.privateKey, senderPublicKey)
    .sharedRx
}

export const decrypt = async (cipher: Uint8Array, nonce: Uint8Array, key: Uint8Array) => {
  if (!sodiumReady) {
    await _sodium.ready
    sodiumReady = true
  }
  const sodium = _sodium

  return sodium.crypto_secretbox_open_easy(cipher, nonce, key)
}
