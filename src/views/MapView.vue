<template>
  <div class="map-container">
    <div class="map-header">
      <h1>工厂地图</h1>
      <div class="header-actions">
        <el-button type="primary" @click="$router.push('/admin')" v-if="authStore.isLoggedIn">
          后台管理
        </el-button>
        <el-button @click="$router.push('/login')" v-else>
          登录
        </el-button>
      </div>
    </div>

    <div id="map-container" class="map-content">
      <!-- 定位按钮 -->
      <div class="location-button" @click="locateToUser">
        <el-icon>
          <Location />
        </el-icon>
      </div>
    </div>

    <!-- 底部抽屉 - 高德地图风格 -->
    <div v-if="showFactoryDetail && selectedFactory" class="amap-style-drawer" @click.self="showFactoryDetail = false">
      <div class="drawer-content">
        <!-- 拖拽指示器 -->
        <div class="drag-indicator"></div>

        <!-- 工厂标题 -->
        <div class="factory-header">
          <h2 class="factory-title">{{ selectedFactory.name }}</h2>
          <div class="factory-subtitle">{{ selectedFactory.address }}</div>
        </div>

        <!-- 快速操作按钮 -->
        <div class="quick-actions">
          <div class="action-item" @click="navigateToFactory">
            <div class="action-icon">
              <el-icon>
                <Location />
              </el-icon>
            </div>
            <span class="action-text">导航</span>
          </div>

          <div class="action-item" @click="copyContactInfo">
            <div class="action-icon">
              <el-icon>
                <CopyDocument />
              </el-icon>
            </div>
            <span class="action-text">复制</span>
          </div>

          <div v-if="selectedFactory.phone" class="action-item" @click="callFactory">
            <div class="action-icon">
              <el-icon>
                <Phone />
              </el-icon>
            </div>
            <span class="action-text">电话</span>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="detail-section">
          <div class="section-title">详细信息</div>

          <div class="detail-item" v-if="selectedFactory.contact">
            <div class="detail-label">联系人</div>
            <div class="detail-value">{{ selectedFactory.contact }}</div>
          </div>

          <div class="detail-item" v-if="selectedFactory.phone">
            <div class="detail-label">联系电话</div>
            <div class="detail-value phone-value" @click="callFactory">
              {{ selectedFactory.phone }}
            </div>
          </div>

          <div class="detail-item description-item">
            <div class="detail-label">工厂简介</div>
            <div class="detail-value description-text">{{ selectedFactory.description }}</div>
          </div>
        </div>

        <!-- 工厂图片 -->
        <div v-if="selectedFactory.images && selectedFactory.images.length" class="images-section">
          <div class="section-title">工厂图片</div>
          <div class="image-item">
            <img :src="API_BASE + selectedFactory.images[0]" :alt="`${selectedFactory.name}`" />
          </div>
        </div>
        <!-- <div v-if="selectedFactory.images?.length" class="images-section">
          <div class="section-title">工厂图片</div>
          <div class="image-grid">
            <div 
              v-for="(image, index) in selectedFactory.images" 
              :key="index"
              class="image-item"
            >
              <img :src="API_BASE + image" :alt="`${selectedFactory.name} - 图片${index + 1}`" />
            </div>
          </div>
        </div> -->

        <!-- 关闭按钮 -->
        <div class="close-button" @click="showFactoryDetail = false">
          <el-icon>
            <Close />
          </el-icon>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <p>正在加载地图数据...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Location,
  Phone,
  CopyDocument,
  Close
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useFactoryStore } from '@/stores/factory'
import type { Factory } from '@/types'
import coordtransform from 'coordtransform'
import {
  waitForAMapSDK,
  createMap,
  // getUserLocation as getUserLocationUtil
} from '@/utils/mapSDK'

declare global {
  interface Window {
    AMap: any
  }
}

const authStore = useAuthStore()
const factoryStore = useFactoryStore()

const API_BASE = (import.meta as any).env.VITE_API_BASE

const loading = ref(false)
const showFactoryDetail = ref(false)
const selectedFactory = ref<Factory | null>(null)
const map = ref<any>(null)
const markers = ref<any[]>([])

// 关闭抽屉的处理函数
// const handleCloseDrawer = (done: () => void) => {
//   selectedFactory.value = null
//   done()
// }

// 导航到工厂
const navigateToFactory = () => {
  if (!selectedFactory.value) return

  const { latitude, longitude, address } = selectedFactory.value

  // 检查是否支持导航
  if (navigator.geolocation) {
    // 使用高德地图导航
    const url = `https://uri.amap.com/navigation?to=${longitude},${latitude},${address}&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=0`
    window.open(url, '_blank')
  } else {
    ElMessage.warning('您的浏览器不支持导航功能')
  }
}

// 拨打工厂电话
const callFactory = () => {
  if (!selectedFactory.value?.phone) return

  try {
    window.location.href = `tel:${selectedFactory.value.phone}`
  } catch {
    ElMessage.warning('无法拨打电话，请手动拨打：' + selectedFactory.value.phone)
  }
}

// 复制联系方式
const copyContactInfo = async () => {
  if (!selectedFactory.value) return

  const contactInfo = [
    `工厂名称：${selectedFactory.value.name}`,
    `地址：${selectedFactory.value.address}`,
    selectedFactory.value.contact ? `联系人：${selectedFactory.value.contact}` : '',
    selectedFactory.value.phone ? `电话：${selectedFactory.value.phone}` : ''
  ].filter(Boolean).join('\n')

  try {
    await navigator.clipboard.writeText(contactInfo)
    ElMessage.success('联系方式已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = contactInfo
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('联系方式已复制到剪贴板')
  }
}



const initMap = async () => {
  try {
    // 等待SDK加载完成
    await waitForAMapSDK()

    // 先获取用户位置，再初始化地图
    const userLocation = await getUserLocationAsync()

    // 使用用户位置或默认位置
    const center = userLocation || [116.397428, 39.90923]

    map.value = await createMap('map-container', {
      zoom: 6,
      center: center,
      mapStyle: 'amap://styles/normal',
      viewMode: '3D', //地图模式
      terrain: true, //开启地形图
    })

    console.log('地图初始化成功')

    // 刷新后延迟执行飞入动画
    map.value.on('complete', () => {
      setTimeout(() => {
        map.value.setZoomAndCenter(12, center, false, 1000) // 动画时间：1000ms
      }, 300)
    })

    // 如果获取到用户位置，添加标记
    if (userLocation) {
      await factoryStore.fetchNearbyFactories({
        latitude: userLocation[1].toString(),
        longitude: userLocation[0].toString()
      })
      addUserLocationMarker(userLocation[0], userLocation[1])
    }
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error(`地图初始化失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 坐标转换：WGS84 转 GCJ02（高德地图坐标系）
const transformCoordinate = (lng: number, lat: number): [number, number] => {
  // 使用 coordtransform 插件进行坐标转换
  // wgs84togcj02: WGS84 转 GCJ02
  const [transformedLng, transformedLat] = coordtransform.wgs84togcj02(lng, lat)
  return [transformedLng, transformedLat]
}

// 异步获取用户位置
const getUserLocationAsync = (): Promise<[number, number] | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('浏览器不支持地理位置')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('原始GPS坐标:', { latitude, longitude })

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
        enableHighAccuracy: true,
        timeout: 5000, // 增加超时时间，提高精度
        maximumAge: 30000 // 减少缓存时间，获取更准确的位置
      }
    )
  })
}

// 获取用户当前位置
// const getUserLocation = () => {
//   if (!navigator.geolocation) {
//     console.log('浏览器不支持地理位置')
//     return
//   }

//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       const { latitude, longitude } = position.coords
//       console.log('获取到用户位置:', { latitude, longitude })

//       // 将地图中心设置为用户位置
//       map.value.setCenter([longitude, latitude])
//       map.value.setZoom(12) // 稍微放大一点

//       // 可选：添加用户位置标记
//       addUserLocationMarker(longitude, latitude)
//     },
//     (error) => {
//       console.log('获取位置失败:', error.message)
//       // 获取位置失败时，保持默认中心点
//     },
//     {
//       enableHighAccuracy: true, // 高精度
//       timeout: 10000, // 10秒超时
//       maximumAge: 60000 // 缓存1分钟
//     }
//   )
// }

/**
 * 添加用户位置标记
 * @param longitude 经度
 * @param latitude 纬度
 */
const addUserLocationMarker = (longitude: number, latitude: number) => {
  try {
    // 创建用户位置标记 - 使用自定义图标
    const userMarker = new window.AMap.Marker({
      position: [longitude, latitude],
      title: '我的位置',
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(25, 25), // 调整图标大小
        image: '/user_loc_icon.png', // 使用用户提供的图片
        imageSize: new window.AMap.Size(25, 25) // 确保图片按指定大小显示
      }),
      offset: new window.AMap.Pixel(-11, -11), // 调整偏移量使图标居中
      zIndex: 1000 // 确保用户位置标记在最上层
    })

    // 添加精度圆圈（表示GPS精度范围）
    const accuracyCircle = new window.AMap.Circle({
      center: [longitude, latitude],
      radius: 30, // 30米精度圆圈
      strokeColor: '#05a4ff',
      strokeOpacity: 0.8,
      strokeWeight: 1.5,
      fillColor: '#FFFFFF',
      fillOpacity: 0.5,
      strokeStyle: 'solid',
      zIndex: 100 // 确保圆圈在标记下方
    })

    // 将标记和精度圆圈添加到地图
    userMarker.setMap(map.value)
    accuracyCircle.setMap(map.value)
    console.log('用户位置标记已添加')
  } catch (error) {
    console.error('添加用户位置标记失败:', error)
  }
}

// 定位到用户位置
const locateToUser = () => {
  if (!navigator.geolocation) {
    ElMessage.warning('您的浏览器不支持地理位置功能')
    return
  }

  ElMessage.info('正在获取您的位置...')

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      console.log('手动定位 - 原始GPS坐标:', { latitude, longitude })

      // 转换坐标系
      const [transformedLng, transformedLat] = transformCoordinate(longitude, latitude)
      console.log('手动定位 - 转换后坐标:', { longitude: transformedLng, latitude: transformedLat })

      // 将地图中心设置为用户位置
      map.value.setCenter([transformedLng, transformedLat])
      map.value.setZoom(14) // 放大到街道级别

      ElMessage.success('已定位到您的位置')
    },
    (error) => {
      console.error('获取位置失败:', error)
      let message = '获取位置失败'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = '请允许获取位置权限'
          break
        case error.POSITION_UNAVAILABLE:
          message = '位置信息不可用'
          break
        case error.TIMEOUT:
          message = '获取位置超时'
          break
      }

      ElMessage.error(message)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 减少缓存时间
    }
  )
}

const loadFactories = async () => {
  try {
    loading.value = true
    await factoryStore.fetchAllFactories()

    if (factoryStore.factories.length > 0) {
      addMarkersToMap()
      // 移除自动跳转到第一个工厂的逻辑，保持用户当前位置
      // const firstFactory = factoryStore.factories[0]
      // map.value.setCenter([firstFactory.longitude, firstFactory.latitude])
    }
  } catch (error) {
    console.error('加载工厂数据失败:', error)
    ElMessage.error('加载工厂数据失败')
  } finally {
    loading.value = false
  }
}

/**
 * 创建带有工厂图片的标记内容
 * @param factory 工厂数据对象
 * @returns HTML字符串，用于标记显示
 */
const createImageMarkerContent = (factory: Factory): string => {
  // const markerIconUrl = API_BASE + (factory.images?.[0] || '')
  const markerIconUrl = API_BASE + '/images/2c748f75-901b-4462-899b-8e670adb347b.png'
  return `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      // border: 2px solid #fff;
      // box-shadow: 0 0 5px rgba(0,0,0,0.3);
    ">
      <img 
        src="${markerIconUrl}"
        style="width: 100%; height: 100%; object-fit: cover;" 
        onerror="this.style.display='none'"
      />
    </div>
  `
}

/**
 * 创建工厂标记对象
 * @param factory 工厂数据对象
 * @returns AMap.Marker 实例
 */
const createFactoryMarker = (factory: Factory): any => {
  // 判断是否为用户附近的工厂
  const isNearby = factoryStore.isNearbyFactory(factory.id)
  // 检查工厂是否有图片资源
  const hasImages = factory.images && factory.images.length > 0

  // 标记基础配置
  const markerOptions: any = {
    position: [factory.longitude, factory.latitude],
    title: factory.name,
    offset: new window.AMap.Pixel(-15, -15) // 标记偏移量，使图标中心对准坐标点
  }

  // 为附近且有图片的工厂设置特殊的图片标记
  if (isNearby && hasImages) {
    markerOptions.content = createImageMarkerContent(factory)
  }
  // 其他工厂使用默认标记样式（由高德地图提供）

  return new window.AMap.Marker(markerOptions)
}

/**
 * 处理标记点击事件
 * @param factory 被点击的工厂数据
 */
const handleMarkerClick = (factory: Factory) => {
  // 设置当前选中的工厂
  selectedFactory.value = factory
  // 延迟显示工厂详情抽屉，提供更好的用户体验
  setTimeout(() => {
    showFactoryDetail.value = true
  }, 500)
}

/**
 * 在地图上添加所有工厂标记
 * 会先清除现有标记，然后为每个工厂创建新的标记
 */
const addMarkersToMap = () => {
  // 清除地图上现有的所有标记
  clearMarkers()

  // 遍历所有工厂数据，为每个工厂创建标记
  factoryStore.factories.forEach((factory) => {
    // 创建工厂标记
    const marker = createFactoryMarker(factory)

    // 绑定点击事件
    marker.on('click', () => handleMarkerClick(factory))

    // 将标记添加到地图上
    marker.setMap(map.value)

    // 将标记保存到数组中，便于后续管理
    markers.value.push(marker)
  })
}

const clearMarkers = () => {
  markers.value.forEach(marker => {
    marker.setMap(null)
  })
  markers.value = []
}

onMounted(async () => {
  try {
    await initMap()
    await loadFactories()
  } catch (error) {
    console.error('页面初始化失败:', error)
    ElMessage.error('页面初始化失败')
  }
})

onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
  clearMarkers()
})
</script>

<style scoped>
.map-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.map-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.map-content {
  flex: 1;
  position: relative;
}

#map-container {
  width: 100%;
  height: 100%;
}

/* 定位按钮 */
.location-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
}

.location-button:hover {
  background: #f5f5f5;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.location-button .el-icon {
  font-size: 20px;
  color: #409eff;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.loading-overlay p {
  margin-top: 16px;
  color: #666;
}

/* 高德地图风格抽屉样式 */
.amap-style-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}

.drawer-content {
  background: #fff;
  width: 100%;
  max-height: 75vh;
  border-radius: 16px 16px 0 0;
  position: relative;
  animation: slideUp 0.3s ease;
  overflow-y: auto;
  padding-bottom: 16px;
}

/* 拖拽指示器 */
.drag-indicator {
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 8px auto;
}

/* 工厂标题 */
.factory-header {
  padding: 0 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.factory-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.factory-subtitle {
  color: #666;
  font-size: 13px;
  line-height: 1.3;
}

/* 快速操作按钮 */
.quick-actions {
  display: flex;
  padding: 12px 16px;
  gap: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #f5f5f5;
}

.action-icon {
  width: 36px;
  height: 36px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.action-text {
  font-size: 11px;
  color: #666;
}

/* 详细信息 */
.detail-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 4px 0;
}

.detail-label {
  color: #666;
  font-size: 13px;
  min-width: 70px;
}

.detail-value {
  color: #333;
  font-size: 13px;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.phone-value {
  color: #409eff;
  cursor: pointer;
}

.phone-value:hover {
  text-decoration: underline;
}

.description-item {
  flex-direction: column;
  align-items: flex-start;
}

.description-text {
  text-align: left;
  line-height: 1.5;
  margin-top: 6px;
  white-space: pre-wrap;
}

/* 图片网格 */
.images-section {
  padding: 12px 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .map-header {
    padding: 12px 16px;
  }

  .map-header h1 {
    font-size: 20px;
  }

  .header-actions {
    gap: 8px;
  }

  /* 移动端抽屉样式调整 */
  .drawer-content {
    max-height: 80vh;
    border-radius: 20px 20px 0 0;
  }

  .factory-title {
    font-size: 17px;
  }

  .quick-actions {
    padding: 10px 12px;
    gap: 12px;
  }

  .action-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .detail-section,
  .images-section {
    padding: 10px 12px;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 4px;
  }

  .close-button {
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
  }

  .location-button {
    bottom: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
  }

  .location-button .el-icon {
    font-size: 18px;
  }
}
</style>
