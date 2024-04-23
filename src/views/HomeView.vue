<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

import { cn } from '@/helpers/cn'
import { useLive, type Config } from '@/helpers/useLive'
import { SupportedChainIds, useConfigStore } from '@/stores/configStore'
import { isAddress, type Address } from 'viem'
import { ref } from 'vue'

const config = ref<Config | undefined>(undefined)
const configStore = useConfigStore()

const form = useForm({
  defaultValues: configStore.config,
  onSubmit: async ({ value }) => {
    config.value = { ...value, roomId: value.roomId.toLowerCase() }

    configStore.setConfig(value)
  },
  validatorAdapter: zodValidator
})

useLive(config)
</script>

<template>
  <main class="m-4">
    <form
      @submit="
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }
      "
    >
      <div>
        <form.Field
          name="chainId"
          :validators="{
            onChange: z.nativeEnum(SupportedChainIds)
          }"
        >
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">Chain id</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="
                  (e) => {
                    const input = (e.target as HTMLInputElement).value
                    const maybeInt = parseInt(input, 10)
                    if (isNaN(maybeInt)) {
                      field.handleChange(input)
                    } else {
                      field.handleChange(maybeInt)
                    }
                  }
                "
                @blur="field.handleBlur"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>
      <div>
        <form.Field name="test">
          <template v-slot="{ field }">
            <label
              :htmlFor="field.name"
              class="form-control w-full max-w-md flex flex-row items-center"
            >
              <input
                type="checkbox"
                :id="field.name"
                :name="field.name"
                class="checkbox"
                :default-checked="configStore.config.test"
                :checked="field.state.value as boolean"
                :onChange="
                  () => {
                    // @ts-ignore
                    field.handleChange(!field.state.value)
                  }
                "
              />
              <div class="ml-2 label">
                <span class="label-text">Testnet?</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field name="joinGlobalRoom">
          <template v-slot="{ field }">
            <label
              :htmlFor="field.name"
              class="form-control w-full max-w-md flex flex-row items-center"
            >
              <input
                type="checkbox"
                :id="field.name"
                :name="field.name"
                class="checkbox"
                :default-checked="configStore.config.joinGlobalRoom"
                :checked="field.state.value as boolean"
                :onChange="
                  () => {
                    // @ts-ignore
                    field.handleChange(!field.state.value)
                  }
                "
              />
              <div class="ml-2 label">
                <span class="label-text">Show in live users tab?</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field
          name="roomId"
          :validators="{
            onChange: z.custom<Address>((val) => isAddress(val as string), 'Invalid address')
          }"
        >
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">ETH address</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                @blur="field.handleBlur"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field
          name="publicKey"
          :validators="{
            onChange: z.string().length(66).startsWith('0x')
          }"
        >
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">Public key</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                @blur="field.handleBlur"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field
          name="privateKey"
          :validators="{
            onChange: z.string().length(66).startsWith('0x')
          }"
        >
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">Private key</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                @blur="field.handleBlur"
                type="password"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field name="model">
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">Model</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                @blur="field.handleBlur"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <div>
        <form.Field name="welcomeMessage">
          <template v-slot="{ field }">
            <label :htmlFor="field.name" class="form-control w-full max-w-md">
              <div class="label">
                <span class="label-text">Welcome message</span>
              </div>
              <input
                :id="field.name"
                :name="field.name"
                :value="field.state.value"
                @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                @blur="field.handleBlur"
                :class="
                  cn(
                    'input input-bordered w-full max-w-md',
                    field.state.meta.touchedErrors.length > 0 && 'input-error'
                  )
                "
              />
              <div class="label">
                <span class="label-text-alt">{{
                  field.state.meta.touchedErrors
                    ? field.state.meta.touchedErrors.reduce(
                        (acc, v, i) => (i === 0 ? `${v}` : `${acc}, ${v}`),
                        ''
                      )
                    : ''
                }}</span>
              </div>
            </label>
          </template>
        </form.Field>
      </div>

      <form.Subscribe>
        <template v-slot="info">
          <button class="btn" type="submit" :disabled="!info.canSubmit || !!config">
            <span>start</span>
          </button>
          <button v-if="config" @click="config = undefined" class="btn ml-2">stop</button>
        </template>
      </form.Subscribe>
    </form>
  </main>
</template>
