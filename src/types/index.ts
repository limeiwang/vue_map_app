// 工厂信息接口
export interface Factory {
  id: string
  name: string         // 工厂名
  address: string      // 地址
  description: string  // 介绍
  contact?: string      // 联系人
  phone?: string        // 电话
  longitude: number    // 经度
  latitude: number     // 纬度
  images?: string[]    // 图片
  createdAt: string
  updatedAt: string
}
// 登录用户信息接口
export interface User {
  id: number
  username: string
  token: string
}

// API 响应接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页参数接口
export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
}

// 分页响应接口
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 登录参数接口
export interface LoginParams {
  username: string
  password: string
}

// 工厂创建/更新参数接口
export interface FactoryParams {
  name: string         // 工厂名
  address: string      // 地址
  description: string  // 介绍
  contact: string      // 联系人
  phone: string        // 电话
  longitude: number    // 经度
  latitude: number     // 纬度
  images?: string[]    // 图片
}
