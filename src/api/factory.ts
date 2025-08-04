import request from './request'
import type { Factory, PaginationParams, PaginationResponse, FactoryParams } from '@/types'

// 获取工厂列表（分页）
export const getFactoryList = (params: PaginationParams) => {
  return request.get<PaginationResponse<Factory>>('/stores', { params })
}

// 获取所有工厂（用于地图展示）
export const getAllFactories = () => {
  return request.get<Factory[]>('/stores/all')
}

// 获取单个工厂详情
export const getFactoryById = (id: number) => {
  return request.get<Factory>(`/stores/${id}`)
}

// 创建工厂
export const createFactory = (data: FactoryParams) => {
  return request.post<Factory>('/stores', {...data, url: data.images?.join()})
}

// 更新工厂
export const updateFactory = (id: string, data: FactoryParams) => {
  return request.put<Factory>(`/stores/${id}`, {...data, url: data.images?.join()})
}

// 删除工厂
export const deleteFactory = (id: string) => {
  return request.delete(`/stores/${id}`)
}

// 上传图片
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  
  return request.post<{ url: string }>('/stores/image/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 
