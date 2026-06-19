import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const savedUserJson = localStorage.getItem('user')
  let savedUser: User | null = null
  if (savedUserJson) {
    try { savedUser = JSON.parse(savedUserJson) } catch {}
  }

  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(savedUser)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function restoreFromStorage() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
    }
    const saved = localStorage.getItem('user')
    if (saved) {
      try { user.value = JSON.parse(saved) } catch {}
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setAuth,
    clearAuth,
    restoreFromStorage
  }
})
