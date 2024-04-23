import { joinRoom, type Room } from 'trystero'
import { v4 as uuid, validate } from 'uuid'
import type { Address } from 'viem'
import { fromBytes, toBytes } from 'viem'
import { onUnmounted, watch, type Ref } from 'vue'
import { createReceiverKey, decrypt } from './crypto'

export type Config = {
  roomId: string
  chainId: number
  test: boolean
  publicKey: string
  privateKey: string
  joinGlobalRoom: boolean
  model: string
  welcomeMessage: string
}

export type P2PMessage = {
  message: string
  publicId: string
  replyId: string | undefined
  tipBlockNumber: number | undefined
}

const knownPeers = new Set<string>()

type LocalMessage = {
  role: 'assistant' | 'user' | 'system'
  content: string
}

const messages: LocalMessage[] = [
  {
    role: 'system',
    content: import.meta.env.VITE_SYSTEM_MESSAGE
  }
]

type EncryptedToken = {
  cipher: string
  nonce: string
  publicKey: string
}

const maxMessageLength = 5000

export const useLive = (config: Ref<Config | undefined>) => {
  let room: Room | undefined
  let globalRoom: Room | undefined

  watch(config, (newConfig) => {
    if (room) {
      room.leave()
      room = undefined
    }
    if (globalRoom) {
      globalRoom.leave()
      globalRoom = undefined
    }

    if (newConfig) {
      const publicKey = toBytes(newConfig.publicKey)
      const privateKey = toBytes(newConfig.privateKey)

      const urls = import.meta.env.VITE_ICE_URLS.split(',')
      const credentials = import.meta.env.VITE_ICE_CREDENTIALS.split(',')
      const usernames = import.meta.env.VITE_ICE_USERNAMES.split(',')

      const iceServers = urls.map((urls, index) => {
        const info: {
          urls: string
          username?: string
          credential?: string
        } = {
          urls
        }
        if (usernames[index]) {
          info['username'] = usernames[index]
        }
        if (credentials[index]) {
          info['credential'] = credentials[index]
        }

        return info
      })

      const roomConfig = {
        appId: `v0_${newConfig.chainId}_jc_${newConfig.test ? 'opsepolia' : 'opmainnet'}`,
        password: newConfig.roomId,
        relayRedundancy: 5,
        rtcConfig: {
          iceServers
        }
      }

      const receiveVerificationTokenEncryptedHandler = async (
        encryptedVerificationToken: EncryptedToken,
        peerId: string,
        sendVerificationTokenRaw: (token: string, peerIds: string[]) => void
      ) => {
        const receiverKey = await createReceiverKey(
          {
            privateKey,
            publicKey
          },
          toBytes(encryptedVerificationToken.publicKey)
        )

        const decryptedVerificationToken = fromBytes(
          await decrypt(
            toBytes(encryptedVerificationToken.cipher),
            toBytes(encryptedVerificationToken.nonce),
            receiverKey
          ),
          'string'
        )

        if (validate(decryptedVerificationToken)) {
          sendVerificationTokenRaw(decryptedVerificationToken, [peerId])
        } else {
          throw new Error('Invalid verification token')
        }
      }

      if (newConfig.joinGlobalRoom) {
        globalRoom = joinRoom({ ...roomConfig, password: 'global' }, 'global')

        const [, receiveVerificationTokenEncrypted] =
          globalRoom.makeAction<EncryptedToken>('TOKEN_ENC')

        const [sendVerificationTokenRaw] = globalRoom.makeAction<string>('TOKEN_RAW')

        const [sendPeerMetadata] = globalRoom.makeAction<{
          publicKeyString: string
          ethAddress: Address
        }>('PEER_META')

        globalRoom.onPeerJoin(async (peerId) => {
          console.log({ globalJoin: peerId })
          await sendPeerMetadata(
            {
              publicKeyString: newConfig.publicKey,
              ethAddress: newConfig.roomId as Address
            },
            peerId
          )
        })
        receiveVerificationTokenEncrypted((token, peerId) =>
          receiveVerificationTokenEncryptedHandler(token, peerId, sendVerificationTokenRaw)
        )
      }

      room = joinRoom(roomConfig, newConfig.roomId)

      const [sendPeerMetadata] = room.makeAction<{
        publicKeyString: string
        ethAddress: Address
      }>('PEER_META')

      const [sendTyping] = room.makeAction<boolean>('TYPING')

      const [, receiveVerificationTokenEncrypted] = room.makeAction<EncryptedToken>('TOKEN_ENC')

      const [sendPeerMessage, receivePeerMessage] = room.makeAction<
        P2PMessage & Record<string, any>
      >('MESSAGE')

      const [sendVerificationTokenRaw] = room.makeAction<string>('TOKEN_RAW')

      receivePeerMessage(async (peerMessage, peerId) => {
        if (!peerMessage.message.startsWith('@bot')) return

        const messageLength = peerMessage.message.length

        if (messageLength > maxMessageLength) {
          await sendPeerMessage({
            message: `bot: keep message shorter than ${maxMessageLength} characters`,
            publicId: uuid(),
            replyId: peerMessage.publicId,
            tipBlockNumber: undefined
          })
          return
        }

        if (peerMessage.message.substring(5).startsWith('/system')) {
          const content = `${peerMessage.message.substring(13)}`
          console.log({ content })
          messages.push({
            role: 'system',
            content
          })
        } else if (peerMessage.message.substring(5).startsWith('/clear')) {
          messages.splice(0, messages.length)
          await sendPeerMessage({
            message: `bot: messages cleared, system message empty`,
            publicId: uuid(),
            replyId: peerMessage.publicId,
            tipBlockNumber: undefined
          })
          return
        } else {
          messages.push({
            role: 'user',
            // let's give bot context who is typing
            content: `${peerId} ${peerMessage.message.substring(4)}`
          })
        }

        await sendTyping(true)

        let messagesTokens = messages.reduce((acc, curr) => {
          return acc + curr.content.split(' ').length
        }, 0)

        while (messagesTokens > 8000) {
          messages.splice(1, 1) // assume first message is system one
          messagesTokens = messages.reduce((acc, curr) => {
            return acc + curr.content.split(' ').length
          }, 0)
        }

        const body = {
          model: newConfig.model,
          messages,
          stream: false,
          options: {
            num_ctx: 8192
          }
        }
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          body: JSON.stringify(body)
        })
        const data = await response.json()

        console.log({ data })

        messages.push({
          role: 'assistant',
          content: data.message.content
        })

        await sendTyping(false)
        await sendPeerMessage({
          message: `bot: ${data.message.content}`,
          publicId: uuid(),
          replyId: peerMessage.publicId,
          tipBlockNumber: undefined
        })
      })

      room.onPeerJoin(async (peerId) => {
        console.log({ roomJoin: peerId })
        await sendPeerMetadata(
          {
            publicKeyString: newConfig.publicKey,
            ethAddress: newConfig.roomId as Address
          },
          peerId
        )

        if (!knownPeers.has(peerId)) {
          knownPeers.add(peerId)
          await sendPeerMessage(
            {
              message: newConfig.welcomeMessage,
              publicId: uuid(),
              replyId: undefined,
              tipBlockNumber: undefined
            },
            peerId
          )
        }
      })

      room.onPeerLeave((peerId: string) => {
        console.log(`${peerId} left`)
      })

      receiveVerificationTokenEncrypted((token, peerId) =>
        receiveVerificationTokenEncryptedHandler(token, peerId, sendVerificationTokenRaw)
      )
    }
  })

  onUnmounted(() => {
    if (room) {
      room.leave()
    }
    if (globalRoom) {
      globalRoom.leave()
    }
  })
}
