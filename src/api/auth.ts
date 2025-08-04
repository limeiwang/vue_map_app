import request from './request'
import type { User, LoginParams } from '@/types'

// 用户登录
export const login = (data: LoginParams) => {
  return request.post<User>('/users/login', data)
}

// 用户登出
export const logout = () => {
  return request.post('/auth/logout')
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return request.get<User>('/auth/me')
} 
