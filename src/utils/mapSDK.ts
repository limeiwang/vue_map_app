import coordtransform from 'coordtransform'

// 地图SDK管理工具
declare global {
  interface Window {
    AMap: any
  }
}

// SDK加载状态
let sdkLoadingPromise: Promise<void> | null = null

/**
 * 加载高德地图SDK
 * @returns Promise<void>
 */
export const loadAMapSDK = (): Promise<void> => {
  // 如果已经加载完成，直接返回
  if (window.AMap) {
    return Promise.resolve()
  }

  // 如果正在加载，返回现有的Promise
  if (sdkLoadingPromise) {
    return sdkLoadingPromise
  }

  // 开始加载SDK
  sdkLoadingPromise = new Promise<void>((resolve, reject) => {
    // 获取API Key
    const apiKey = (import.meta as any).env.VITE_AMAP_KEY
    if (!apiKey) {
      reject(new Error('高德地图 API Key 未配置，请在 .env 文件中设置 VITE_AMAP_KEY'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`
    
    script.onload = () => {
      console.log('高德地图 SDK 加载成功')
      resolve()
    }
    
    script.onerror = () => {
      console.error('高德地图 SDK 加载失败')
      sdkLoadingPromise = null
      reject(new Error('高德地图 SDK 加载失败，请检查网络连接和 API Key'))
    }
    
    document.head.appendChild(script)
  })

  return sdkLoadingPromise
}

/**
 * 检查SDK是否已加载
 * @returns boolean
 */
export const isAMapSDKLoaded = (): boolean => {
  return !!window.AMap
}

/**
 * 等待SDK加载完成
 * @returns Promise<void>
 */
export const waitForAMapSDK = async (): Promise<void> => {
  if (isAMapSDKLoaded()) {
    return
  }

  // 加载SDK
  await loadAMapSDK()
}

/**
 * 创建地图实例
 * @param containerId 容器ID
 * @param options 地图配置选项
 * @returns Promise<any> 地图实例
 */
export const createMap = async (
  containerId: string, 
  options: any = {}
): Promise<any> => {
  await waitForAMapSDK()
  
  if (!window.AMap) {
    throw new Error('地图SDK未加载')
  }

  const defaultOptions = {
    zoom: 14,
    center: [116.397428, 39.90923],
    mapStyle: 'amap://styles/normal',
    viewMode: '2D',
    dragEnable: true,
    zoomEnable: true,
    doubleClickZoom: false
  }

  return new window.AMap.Map(containerId, {
    ...defaultOptions,
    ...options
  })
}

/**
 * 创建地图标记
 * @param position 位置坐标 [lng, lat]
 * @param options 标记配置选项
 * @returns any 标记实例
 */
export const createMarker = (position: [number, number], options: any = {}): any => {
  if (!window.AMap) {
    throw new Error('地图SDK未加载')
  }

  const defaultOptions = {
    position,
    map: null
  }

  return new window.AMap.Marker({
    ...defaultOptions,
    ...options
  })
}

/**
 * 创建圆形覆盖物
 * @param center 圆心坐标 [lng, lat]
 * @param radius 半径（米）
 * @param options 圆形配置选项
 * @returns any 圆形实例
 */
export const createCircle = (
  center: [number, number], 
  radius: number, 
  options: any = {}
): any => {
  if (!window.AMap) {
    throw new Error('地图SDK未加载')
  }

  const defaultOptions = {
    center,
    radius,
    strokeColor: '#409EFF',
    strokeOpacity: 0.15,
    strokeWeight: 1,
    fillColor: '#409EFF',
    fillOpacity: 0.03,
    strokeStyle: 'solid'
  }

  return new window.AMap.Circle({
    ...defaultOptions,
    ...options
  })
}

/**
 * 坐标转换：WGS84 转 GCJ02（高德地图坐标系）
 * @param lng 经度
 * @param lat 纬度
 * @returns [number, number] 转换后的坐标
 */
export const transformCoordinate = (lng: number, lat: number): [number, number] => {
  // 这里可以集成 coordtransform 库
  // 暂时返回原坐标，实际使用时需要导入 coordtransform
  const [transformedLng, transformedLat] = coordtransform.wgs84togcj02(lng, lat)
  return [transformedLng, transformedLat]
}

/**
 * 获取用户位置
 * @param options 定位配置选项
 * @returns Promise<[number, number] | null> 用户位置坐标
 */
export const getUserLocation = (options: any = {}): Promise<[number, number] | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('浏览器不支持地理位置')
      resolve(null)
      return
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('获取到用户位置:', { latitude, longitude })
        
        // 转换坐标系
        const [transformedLng, transformedLat] = transformCoordinate(longitude, latitude)
        console.log('转换后坐标:', { longitude: transformedLng, latitude: transformedLat })
        
        resolve([transformedLng, transformedLat])
      },
      (error) => {
        console.log('获取位置失败:', error.message)
        resolve(null)
      },
      {
        ...defaultOptions,
        ...options
      }
    )
  })
} 
