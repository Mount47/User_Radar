<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const username = ref('')
const password = ref('')
const errorText = ref('')

async function handleSubmit() {
  if (!username.value || !password.value) {
    errorText.value = '请输入账号与密码'
    return
  }
  errorText.value = ''
  await store.login({ username: username.value, password: password.value })
  router.push((route.query.redirect as string) || '/')
}
</script>

<template>
  <section class="login-shell">
    <div class="glass-panel">
      <p class="eyebrow">Caregiver Console</p>
      <h2>欢迎回来</h2>
      <p class="subtitle">账号密码登录，获取我负责的人员与设备范围</p>
      <form @submit.prevent="handleSubmit">
        <label>
          <span>用户名</span>
          <input v-model="username" type="text" autocomplete="username" placeholder="请输入用户名" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" />
        </label>
        <p v-if="errorText" class="error">{{ errorText }}</p>
        <button type="submit" :disabled="store.loading">{{ store.loading ? '登录中…' : '进入面板' }}</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login-shell {
  min-height: calc(100vh - 200px);
  display: grid;
  place-items: center;
}

.glass-panel {
  width: min(420px, 100%);
  padding: 2.5rem;
  border-radius: 26px;
  background: rgba(8, 11, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.35);
}

.eyebrow {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

h2 {
  font-size: 2rem;
  margin: 0.5rem 0 0.25rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

label span {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

input {
  width: 100%;
  margin-top: 0.4rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

button[type='submit'] {
  border: none;
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  color: #05060a;
  font-weight: 600;
  cursor: pointer;
}

button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #f87171;
  font-size: 0.85rem;
}
</style>
