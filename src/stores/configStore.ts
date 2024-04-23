import { type Config } from '@/helpers/useLive'
import { defineStore } from 'pinia'

export enum SupportedChainIds {
  opSepolia = 11155420,
  opMainnet = 10
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {
      chainId: SupportedChainIds.opSepolia,
      test: true,
      roomId: '',
      publicKey: '',
      privateKey: '',
      joinGlobalRoom: true,
      model: 'llama3:70b',
      welcomeMessage:
        "Hello, if you would like to write to a bot, please start your message with '@bot' write message and press enter"
    } as Config
  }),
  actions: {
    setConfig(config: Config) {
      this.config = config
    }
  },
  persist: true
})
