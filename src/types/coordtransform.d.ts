declare module 'coordtransform' {
  /**
   * WGS84 转 GCJ02（高德地图坐标系）
   * @param lng 经度
   * @param lat 纬度
   * @returns [经度, 纬度]
   */
  export function wgs84togcj02(lng: number, lat: number): [number, number]

  /**
   * GCJ02 转 WGS84
   * @param lng 经度
   * @param lat 纬度
   * @returns [经度, 纬度]
   */
  export function gcj02towgs84(lng: number, lat: number): [number, number]

  /**
   * GCJ02 转 BD09（百度地图坐标系）
   * @param lng 经度
   * @param lat 纬度
   * @returns [经度, 纬度]
   */
  export function gcj02tobd09(lng: number, lat: number): [number, number]

  /**
   * BD09 转 GCJ02
   * @param lng 经度
   * @param lat 纬度
   * @returns [经度, 纬度]
   */
  export function bd09togcj02(lng: number, lat: number): [number, number]
} 
