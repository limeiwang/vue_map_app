import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Factory, PaginationParams, FactoryParams, NearbyFactoryParams } from '@/types'
import {
  getFactoryList,
  getAllFactories,
  getNearbyFactories,
  getFactoryById,
  createFactory,
  updateFactory,
  deleteFactory
} from '@/api/factory'

export const useFactoryStore = defineStore('factory', () => {
  // 状态
  const factories = ref<Factory[]>([])
  const currentFactory = ref<Factory | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const keyword = ref('')
  const nearbyFactoryIds = ref<string[]>([])

  // 计算属性
  const hasFactories = computed(() => factories.value.length > 0)
  
  // 判断工厂是否在附近工厂列表中
  const isNearbyFactory = (factoryId: string) => {
    return nearbyFactoryIds.value.includes(factoryId)
  }

  // 获取工厂列表（分页）
  const fetchFactories = async (params?: Partial<PaginationParams>) => {
    try {
      loading.value = true
      const requestParams = {
        page: params?.page || currentPage.value,
        pageSize: params?.pageSize || pageSize.value,
        keyword: params?.keyword || keyword.value
      }
      
      const response = await getFactoryList(requestParams)
      // 这里 response.data.data 是后端返回的数组
      const rawList = (response as any).data.data as any[]
      // 做一次映射
      factories.value = rawList.map(item => ({
        id: item.id,
        name: item.name,
        address: item.address || '',
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        images: item.image_url ? [item.image_url] : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        phone: item.phone,
        contact: item.contact,
        showImage: false // 默认隐藏图片
      }))
      // 你可以根据后端返回的分页信息设置 total、currentPage、pageSize
      // 例如如果后端有 total 字段：total.value = response.data.total
      total.value = response.data.total
      currentPage.value = response.data.page
      pageSize.value = response.data.pageSize
      return factories.value
      // const response = await getFactoryList(requestParams)
      // const data = response.data
      // console.log(data, '-------');
      
      // factories.value = data.list
      // total.value = data.total
      // currentPage.value = data.page
      // pageSize.value = data.pageSize
      
      // return data
    } finally {
      loading.value = false
    }
  }

  // 获取所有工厂（用于地图展示）
  const fetchAllFactories = async () => {
    try {
      loading.value = true
      // const response = await getAllFactories()
      // factories.value = response.data.data
      const response = await getFactoryList({ page: 1, pageSize: 10000 })
      const rawList = (response as any).data.data as any[]
      factories.value = rawList.map(item => ({
        id: item.id,
        name: item.name,
        address: item.address || '',
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        images: item.image_url ? [item.image_url] : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        phone: item.phone,
        contact: item.contact,
        showImage: false // 默认隐藏图片
      }))
      return response.data.data
    } finally {
      loading.value = false
    }
  }

  // 获取附近工厂（用于图片展示）
  const fetchNearbyFactories = async (params: NearbyFactoryParams) => {
    try {
      loading.value = true
      const response = await getNearbyFactories(params)
      console.log(response.data, '---response---');
      
      // 提取附近工厂的ID列表
      if (response.data && response.data.data) {
        nearbyFactoryIds.value = response.data.data.map((item: any) => item.id)
      }
      
      return response.data
    } finally {
      loading.value = false
    }
  }

  // 获取单个工厂详情
  const fetchFactoryById = async (id: number) => {
    try {
      loading.value = true
      const response = await getFactoryById(id)
      currentFactory.value = response.data
      return response.data
    } finally {
      loading.value = false
    }
  }

  // 创建工厂
  const addFactory = async (data: FactoryParams) => {
    try {
      loading.value = true
      const response = await createFactory(data)
      const newFactory = response.data
      
      // 添加到列表中
      factories.value.unshift(newFactory)
      total.value += 1
      
      return newFactory
    } finally {
      loading.value = false
    }
  }

  // 更新工厂
  const editFactory = async (id: string, data: FactoryParams) => {
    try {
      loading.value = true
      const response = await updateFactory(id, data)
      const updatedFactory = response.data
      
      // 更新列表中的工厂
      const index = factories.value.findIndex(f => f.id === id)
      if (index !== -1) {
        factories.value[index] = updatedFactory
      }
      
      // 如果当前查看的就是这个工厂，也要更新
      if (currentFactory.value?.id === id) {
        currentFactory.value = updatedFactory
      }
      
      return updatedFactory
    } finally {
      loading.value = false
    }
  }

  // 删除工厂
  const removeFactory = async (id: string) => {
    try {
      loading.value = true
      await deleteFactory(id)
      
      // 从列表中移除
      const index = factories.value.findIndex(f => f.id === id)
      if (index !== -1) {
        factories.value.splice(index, 1)
        total.value -= 1
      }
      
      // 如果当前查看的就是这个工厂，清空当前工厂
      if (currentFactory.value?.id === id) {
        currentFactory.value = null
      }
    } finally {
      loading.value = false
    }
  }

  // 搜索工厂
  const searchFactories = async (searchKeyword: string) => {
    keyword.value = searchKeyword
    return await fetchFactories({ page: 1, keyword: searchKeyword })
  }

  // 重置状态
  const resetState = () => {
    factories.value = []
    currentFactory.value = null
    loading.value = false
    total.value = 0
    currentPage.value = 1
    pageSize.value = 10
    keyword.value = ''
  }

  return {
    factories,
    currentFactory,
    loading,
    total,
    currentPage,
    pageSize,
    keyword,
    hasFactories,
    nearbyFactoryIds,
    isNearbyFactory,
    fetchFactories,
    fetchAllFactories,
    fetchNearbyFactories,
    fetchFactoryById,
    addFactory,
    editFactory,
    removeFactory,
    searchFactories,
    resetState
  }
}) 
