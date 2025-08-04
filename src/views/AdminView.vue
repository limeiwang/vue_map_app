<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>工厂管理后台</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddFactory">新增工厂</el-button>
        <el-button @click="handleLogout">退出登录</el-button>
        <el-button type="text" @click="$router.push('/')">返回地图</el-button>
      </div>
    </div>

    <div class="admin-search">
      <el-input
        v-model="searchKeyword"
        placeholder="输入工厂名/地址进行搜索"
        clearable
        @keyup.enter="handleSearch"
        style="max-width: 300px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table
      :data="factoryStore.factories"
      v-loading="factoryStore.loading"
      style="width: 100%; margin-top: 16px"
      border
      highlight-current-row
    >
      <el-table-column label="序号" width="60" align="center" type="index"/>
      <el-table-column prop="name" label="工厂名" min-width="120" />
      <el-table-column prop="address" label="地址" min-width="180" />
      <el-table-column prop="description" label="介绍" min-width="180" />
      <el-table-column label="图片" min-width="120">
        <template #default="scope">
          <div v-if="scope.row.images && scope.row.images.length">
            <el-button 
              v-if="!scope.row.showImage" 
              size="small" 
              type="primary" 
              @click="showFactoryImage(scope.row)"
            >
              查看图片
            </el-button>
            <div v-else class="image-display">
              <el-image
                :src="API_BASE + scope.row.images[0]"
                style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px"
                :preview-src-list="getPreviewSrcList(scope.row.images)"
                preview-teleported
              />
              <el-button 
                size="small" 
                type="text" 
                @click="hideFactoryImage(scope.row)"
                style="margin-left: 8px"
              >
                隐藏
              </el-button>
            </div>
          </div>
          <span v-else style="color: #aaa">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="contact" label="联系人" min-width="100" />
      <el-table-column prop="phone" label="电话" min-width="120" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEditFactory(scope.row)">编辑</el-button>
          <el-popconfirm title="确定删除该工厂？" @confirm="handleDeleteFactory(scope.row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="admin-pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="factoryStore.total || 0"
        :page-size="factoryStore.pageSize || 10"
        :current-page="factoryStore.currentPage || 1"
        :page-sizes="[10, 20, 50, 100]"
        :hide-on-single-page="true"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 工厂编辑/新增弹窗 -->
    <el-dialog v-model="showEditDialog" :title="editMode ? '编辑工厂' : '新增工厂'" width="600px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <!-- 工厂名 -->
        <el-form-item label="工厂名" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入工厂名" />
        </el-form-item>
        
        <!-- 地址 -->
        <el-form-item label="地址" prop="address">
          <el-input v-model="editForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        
        <!-- 位置信息 -->
        <el-form-item prop="location" class="location-form-item">
          <div class="location-picker">
            <!-- 位置信息头部 -->
            <div class="location-header">
              <div class="location-title">
                <el-icon class="location-icon"><Location /></el-icon>
                <span>位置信息</span>
              </div>
              <div class="location-actions">
                <el-button 
                  size="small" 
                  :type="inputMode ? 'primary' : 'default'"
                  @click="switchToInputMode"
                >
                  <el-icon><Edit /></el-icon>
                  手动输入
                </el-button>
                <el-button 
                  size="small" 
                  :type="!inputMode ? 'primary' : 'default'"
                  @click="switchToMapMode"
                >
                  <el-icon><MapLocation /></el-icon>
                  地图选点
                </el-button>
              </div>
            </div>
            
            <!-- 地图区域 -->
            <div v-if="!inputMode" class="map-container">
              <div id="mini-map" class="mini-map"></div>
              <!-- <div id="search-top">
                <label>请输入关键字：</label>
                <input id="searchInput" type="text" placeholder="" />
              </div> -->
            </div>
            
            <!-- 坐标输入/显示 -->
            <div class="coordinate-display">
              <div class="coordinate-item">
                <label>经度 (Longitude)</label>
                <el-input 
                  v-model="editForm.longitude" 
                  type="number" 
                  :step="0.000001" 
                  :precision="6"
                  placeholder="0.000000"
                  :disabled="!inputMode"
                  @input="onCoordinateChange"
                />
              </div>
              <div class="coordinate-item">
                <label>纬度 (Latitude)</label>
                <el-input 
                  v-model="editForm.latitude" 
                  type="number" 
                  :step="0.000001" 
                  :precision="6"
                  placeholder="0.000000"
                  :disabled="!inputMode"
                  @input="onCoordinateChange"
                />
              </div>
            </div>
          </div>
        </el-form-item>
        
        <!-- 介绍 -->
        <el-form-item label="介绍" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            placeholder="请输入工厂介绍"
            :rows="4"
            :maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 联系人 -->
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="editForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        
        <!-- 电话 -->
        <el-form-item label="电话" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入电话" />
        </el-form-item>
        
        <!-- 图片 -->
        <el-form-item label="图片">
          <el-upload
            action=""
            :http-request="handleUpload"
            list-type="picture-card"
            :file-list="uploadFileList"
            :on-remove="handleRemoveImage"
            :limit="1"
            :auto-upload="true"
            :show-file-list="true"
            :disabled="uploadFileList.length >= 1"
          >
            <template #default>
              <el-icon><Plus /></el-icon>
            </template>
            <template #file="{ file }">
              <img :src="file.url" class="el-upload-list__item-thumbnail" />
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFactory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Location, MapLocation, Pointer, Check, Edit } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFactoryStore } from '@/stores/factory'
import { uploadImage } from '@/api/factory'
import type { Factory, FactoryParams } from '@/types'
import { waitForAMapSDK, createMap, createMarker, getUserLocation } from '@/utils/mapSDK'

declare global {
  interface Window {
    AMap: any
  }
}

const API_BASE = (import.meta as any).env.VITE_API_BASE

const router = useRouter()
const authStore = useAuthStore()
const factoryStore = useFactoryStore()

const searchKeyword = ref('')

// 编辑弹窗相关
const showEditDialog = ref(false)
const editMode = ref(false) // false: 新增, true: 编辑
const editFormRef = ref<FormInstance>()
const editForm = reactive<FactoryParams>({
  name: '',         // 工厂名
  address: '',      // 地址
  description: '',  // 介绍
  contact: '',      // 联系人
  phone: '',        // 电话
  longitude: 0,     // 经度
  latitude: 0,      // 纬度
  images: []        // 图片
})
const uploadFileList = ref<any[]>([])

// 位置选择相关
const inputMode = ref(false) // false: 地图选点模式, true: 手动输入模式

const editRules: FormRules = {
  name: [{ required: true, message: '请输入工厂名', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  description: [{ required: true, message: '请输入介绍', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }]
}

// 分页、搜索
const handlePageChange = (page: number) => {
  factoryStore.fetchFactories({ page })
}
const handleSizeChange = (size: number) => {
  factoryStore.fetchFactories({ page: 1, pageSize: size })
}
const handleSearch = () => {
  factoryStore.searchFactories(searchKeyword.value)
}
const resetSearch = () => {
  searchKeyword.value = ''
  factoryStore.fetchFactories({ page: 1, keyword: '' })
}

// 新增工厂
const handleAddFactory = () => {
  editMode.value = false
  Object.assign(editForm, {
    name: '',
    address: '',
    description: '',
    latitude: 0,
    longitude: 0,
    images: [],
    contact: '',
    phone: ''
  })
  uploadFileList.value = []
  showEditDialog.value = true
}

// 编辑工厂
const handleEditFactory = (factory: Factory) => {
  editMode.value = true
  Object.assign(editForm, factory)
  uploadFileList.value = (factory.images || []).map((url: string) => ({ 
    url: API_BASE + url,
    name: url.split('/').pop() 
  }))
  showEditDialog.value = true
}

// 删除工厂
const handleDeleteFactory = async (id: string) => {
  await factoryStore.removeFactory(id)
  ElMessage.success('删除成功')
}

// 保存工厂（新增/编辑）
const handleSaveFactory = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()
  // 处理图片
  editForm.images = uploadFileList.value.map(f => f.url)
  if (editMode.value) {
    await factoryStore.editFactory((editForm as any).id, editForm)
    ElMessage.success('编辑成功')
  } else {
    await factoryStore.addFactory(editForm)
    ElMessage.success('新增成功')
  }
  showEditDialog.value = false
  factoryStore.fetchFactories()
}

// 上传图片
const handleUpload = async (option: any) => {
  const file = option.file
  try {
    const res = await uploadImage(file)
    uploadFileList.value.push({ url: (res as any).data.data.image_url })
    option.onSuccess(res, file)
  } catch (e) {
    option.onError(e)
  }
}
const handleRemoveImage = (file: any) => {
  uploadFileList.value = uploadFileList.value.filter(f => f.url !== file.url)
}

// 获取预览图片列表
const getPreviewSrcList = (images: string[] | undefined): string[] => {
  if (!images || images.length === 0) return []
  return images.map((img: string) => API_BASE + img)
}

// 模式切换方法
const switchToInputMode = () => {
  inputMode.value = true
}

const switchToMapMode = () => {
  inputMode.value = false
  // 等待DOM更新后初始化地图
  nextTick(() => {
    setTimeout(() => {
      if (showEditDialog.value) {
        initMiniMap()
      }
    }, 200)
  })
}

let miniMap: any = null
let mapMarker: any = null



const initMiniMap = async () => {
  try {
    // 确保地图容器存在
    const mapContainer = document.getElementById('mini-map')
    if (!mapContainer) {
      console.error('地图容器不存在，等待DOM渲染...')
      setTimeout(retryInitMap, 100)
      return
    }

    // 检查容器是否可见
    if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
      console.error('地图容器尺寸为0，等待渲染...')
      setTimeout(retryInitMap, 100)
      return
    }

    // 等待SDK加载完成
    await waitForAMapSDK()

    // 设置地图容器的样式
    mapContainer.style.width = '100%'
    mapContainer.style.height = '100%'

    // 如果已经存在地图实例，先销毁
    if (miniMap) {
      miniMap.destroy()
      miniMap = null
    }

    // 获取用户当前位置作为默认中心点
    let defaultCenter: [number, number] = [116.397428, 39.90923] // 默认北京
    let defaultZoom = 14

    try {
      const userLocation = await getUserLocation()
      if (userLocation) {
        defaultCenter = userLocation
        defaultZoom = 12 // 用户位置时稍微放大一点
        console.log('使用用户当前位置作为地图中心:', defaultCenter)
      } else {
        console.log('无法获取用户位置，使用默认位置')
      }
    } catch (error) {
      console.log('获取用户位置失败，使用默认位置:', error)
    }

    // 如果有编辑表单中的坐标，优先使用
    if (editForm.longitude && editForm.latitude && editForm.longitude !== 0 && editForm.latitude !== 0) {
      defaultCenter = [editForm.longitude, editForm.latitude]
      defaultZoom = 14
    }

    miniMap = await createMap('mini-map', {
      zoom: defaultZoom,
      center: defaultCenter,
      mapStyle: 'amap://styles/normal',
      viewMode: '2D',
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: false
    })

    // 添加点击事件
    miniMap.on('click', (e: any) => {
      const { lng, lat } = e.lnglat
      editForm.longitude = lng
      editForm.latitude = lat
      
      // 更新标记
      if (mapMarker) {
        mapMarker.setPosition([lng, lat])
      } else {
        mapMarker = createMarker([lng, lat], { map: miniMap })
      }
      
      ElMessage.success('位置已选择')
    })

    // 如果有初始坐标，添加标记
    if (editForm.longitude && editForm.latitude && editForm.longitude !== 0 && editForm.latitude !== 0) {
      mapMarker = createMarker([editForm.longitude, editForm.latitude], { map: miniMap })
    }
  } catch (error) {
    console.error('初始化地图失败:', error)
    ElMessage.error('地图初始化失败')
  }
}

// 坐标变化处理
const onCoordinateChange = () => {
  // 验证坐标范围
  if (editForm.longitude < -180 || editForm.longitude > 180) {
    ElMessage.warning('经度范围应在 -180 到 180 之间')
    return
  }
  if (editForm.latitude < -90 || editForm.latitude > 90) {
    ElMessage.warning('纬度范围应在 -90 到 90 之间')
    return
  }
  
  // 更新地图标记
  if (miniMap && mapMarker && editForm.longitude && editForm.latitude) {
    mapMarker.setPosition([editForm.longitude, editForm.latitude])
    miniMap.setCenter([editForm.longitude, editForm.latitude])
  }
}

// 显示工厂图片
const showFactoryImage = (factory: any) => {
  factory.showImage = true
  // 添加延迟加载，确保DOM更新后再加载图片
  nextTick(() => {
    // 这里可以添加图片加载状态
    console.log('开始加载图片:', factory.name)
  })
}

// 隐藏工厂图片
const hideFactoryImage = (factory: any) => {
  factory.showImage = false
  // 可以选择是否清除图片缓存
  // factory.images = []
}

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// 初始化加载
factoryStore.fetchFactories()

// 监听弹窗状态和输入模式，在弹窗打开后或切换到地图模式时初始化地图
watch([showEditDialog, inputMode], ([dialogVal, modeVal]) => {
  if (dialogVal && !modeVal) {
    // 弹窗打开且为地图选点模式时，延迟初始化地图
    nextTick(() => {
      setTimeout(() => {
        initMiniMap()
      }, 300)
    })
  } else if (!dialogVal) {
    // 弹窗关闭时销毁地图
    if (miniMap) {
      miniMap.destroy()
      miniMap = null
    }
    if (mapMarker) {
      mapMarker = null
    }
  }
})

// 添加重试机制
const retryInitMap = () => {
  const mapContainer = document.getElementById('mini-map')
  if (mapContainer && mapContainer.offsetWidth > 0 && mapContainer.offsetHeight > 0) {
    initMiniMap()
  } else {
    setTimeout(retryInitMap, 100)
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 12px 40px 12px;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.admin-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.admin-search {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.admin-pagination {
  margin: 24px 0 0 0;
  text-align: right;
}
/* 位置选择器样式 */
.location-form-item {
  margin-bottom: 20px;
}

.location-form-item .el-form-item__content {
  width: 100%;
}

.location-picker {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
  overflow: hidden;
  width: 100%;
}

.location-picker:hover {
  border-color: #409eff;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.location-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.location-icon {
  color: #409eff;
  font-size: 16px;
}

.location-actions {
  display: flex;
  gap: 8px;
}



.map-container {
  height: 200px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}



.map-container {
  height: 200px;
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.mini-map {
  width: 100%;
  height: 100%;
}

#search-top {
	position: absolute;
	top: 5px;
	right: 10px;
	background: #fff none repeat scroll 0 0;
	border: 1px solid rgb(204, 204, 204);
	margin: 10px auto;
	padding:6px;
	font-family: "Microsoft Yahei", "微软雅黑", "Pinghei";
	font-size: 14px;
}

.coordinate-display {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
}

.coordinate-item {
  flex: 1;
}

.coordinate-item label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.coordinate-item .el-input {
  font-family: 'Courier New', monospace;
}

/* 图片显示样式 */
.image-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
  
/* 表单帮助文本 */
.form-help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 8px 2px 24px 2px;
  }
  .admin-header h1 {
    font-size: 18px;
  }
  .header-actions {
    gap: 6px;
  }
  
  .location-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .location-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .coordinate-display {
    flex-direction: column;
    gap: 12px;
  }
  
  .map-container {
    height: 150px;
  }
  
  .location-picker {
    margin: 0 -8px;
  }
}
</style> 
