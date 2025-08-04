import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // 从 localStorage 初始化状态
  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  // 登录
  const login = async (username: string, password: string) => {
    try {
      loading.value = true
      const response = await loginApi({ username, password })
      const userData = response.data
      
      // 保存到 store
      user.value = userData
      token.value = userData.token
      
      // 保存到 localStorage
      localStorage.setItem('token', userData.token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return userData
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      // 即使 API 调用失败，也要清除本地状态
      console.error('登出 API 调用失败:', error)
    } finally {
      // 清除本地状态
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser()
      const userData = response.data
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (error) {
      // 如果获取用户信息失败，清除本地状态
      logout()
      throw error
    }
  }

  // 初始化时检查认证状态
  initAuth()

  return {
    user,
    token,
    loading,
    isLoggedIn,
    login,
    logout,
    fetchCurrentUser,
    initAuth
  }
}) 
 