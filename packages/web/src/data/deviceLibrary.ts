export type DeviceIconType =
  | 'ipc-bullet'
  | 'ipc-dome'
  | 'ipc-turret'
  | 'ipc-fisheye'
  | 'ptz'
  | 'nvr'
  | 'dvr'
  | 'access'
  | 'control-keyboard'
  | 'intercom-indoor'
  | 'mobile-app'
  | 'nvms'
  | 'server'
  | 'server-forward'
  | 'server-storage'
  | 'server-manage'
  | 'decoder'
  | 'videowall'
  | 'switch'
  | 'router'
  | 'firewall'
  | 'pc'
  | 'ap'
  | 'cloud'

/** 品牌分类：TVT / 通用网络 */
export type DeviceBrand = 'tvt' | 'generic'

export type DeviceItem = {
  id: string
  name: string
  icon: DeviceIconType
  brand: DeviceBrand
  /** 用户自定义添加的元件 */
  custom?: boolean
}

export type DeviceCategory = {
  id: string
  name: string
  brand: DeviceBrand
  items: DeviceItem[]
}

export const iconOptions: { value: DeviceIconType; label: string }[] = [
  { value: 'ipc-bullet', label: '筒形 IPC' },
  { value: 'ipc-dome', label: '半球 IPC' },
  { value: 'ipc-turret', label: '筒机 / 海螺' },
  { value: 'ipc-fisheye', label: '全景 IPC' },
  { value: 'ptz', label: '球机' },
  { value: 'nvr', label: '录像机' },
  { value: 'dvr', label: 'DVR' },
  { value: 'access', label: '门禁' },
  { value: 'control-keyboard', label: '控制键盘' },
  { value: 'intercom-indoor', label: '室内对讲机' },
  { value: 'mobile-app', label: '手机 App' },
  { value: 'nvms', label: 'NVMS 平台' },
  { value: 'server', label: '服务器' },
  { value: 'server-forward', label: '转发服务器' },
  { value: 'server-storage', label: '存储服务器' },
  { value: 'server-manage', label: '管理服务器' },
  { value: 'decoder', label: '解码器' },
  { value: 'videowall', label: '电视墙' },
  { value: 'switch', label: '交换机' },
  { value: 'router', label: '路由器' },
  { value: 'firewall', label: '防火墙' },
  { value: 'pc', label: 'PC / 工作站' },
  { value: 'ap', label: '无线 AP' },
  { value: 'cloud', label: 'Internet / 云' },
]

/** 已上传产品图片的设备类型图标；TVT 分类只保留这些图标。 */
export const tvtProductImageIcons = new Set<DeviceIconType>([
  'ipc-bullet',
  'ptz',
  'nvr',
  'access',
  'control-keyboard',
  'intercom-indoor',
  'mobile-app',
  'nvms',
  'server-forward',
  'server-storage',
  'server-manage',
  'decoder',
])

const genericNetworkIcons = new Set<DeviceIconType>([
  'server',
  'switch',
  'router',
  'firewall',
  'pc',
  'ap',
  'cloud',
])

export function iconOptionsForBrand(brand: DeviceBrand) {
  return brand === 'tvt'
    ? iconOptions.filter((option) => tvtProductImageIcons.has(option.value))
    : iconOptions.filter((option) => genericNetworkIcons.has(option.value))
}

export const brandColors: Record<DeviceBrand, string> = {
  tvt: '#2f5d50',
  generic: '#5a6574',
}

export const brandLabels: Record<DeviceBrand, string> = {
  tvt: '设备类型',
  generic: '通用网络',
}

/** 内置默认元件库 */
export const defaultDeviceLibrary: DeviceCategory[] = [
  {
    id: 'tvt',
    name: '设备类型',
    brand: 'tvt',
    items: [
      { id: 'tvt-camera', name: '摄像机', icon: 'ipc-bullet', brand: 'tvt' },
      { id: 'tvt-nvr', name: '录像机', icon: 'nvr', brand: 'tvt' },
      { id: 'tvt-ptz', name: 'PTZ球机', icon: 'ptz', brand: 'tvt' },
      { id: 'tvt-nvms', name: 'NVMS 平台', icon: 'nvms', brand: 'tvt' },
      { id: 'tvt-decoder', name: '解码器', icon: 'decoder', brand: 'tvt' },
      { id: 'tvt-server-manage', name: '管理服务器', icon: 'server-manage', brand: 'tvt' },
      { id: 'tvt-server-storage', name: '存储服务器', icon: 'server-storage', brand: 'tvt' },
      { id: 'tvt-server-forward', name: '流媒体服务器', icon: 'server-forward', brand: 'tvt' },
      { id: 'tvt-control-keyboard', name: '控制键盘', icon: 'control-keyboard', brand: 'tvt' },
      { id: 'tvt-access-outdoor', name: '室外门禁', icon: 'access', brand: 'tvt' },
      { id: 'tvt-intercom-indoor', name: '室内对讲机', icon: 'intercom-indoor', brand: 'tvt' },
      { id: 'tvt-mobile-app', name: '手机 App', icon: 'mobile-app', brand: 'tvt' },
    ],
  },
  {
    id: 'generic',
    name: '通用网络',
    brand: 'generic',
    items: [
      { id: 'gen-switch', name: '交换机', icon: 'switch', brand: 'generic' },
      { id: 'gen-router', name: '路由器', icon: 'router', brand: 'generic' },
      { id: 'gen-firewall', name: '防火墙', icon: 'firewall', brand: 'generic' },
      { id: 'gen-pc', name: 'PC / 工作站', icon: 'pc', brand: 'generic' },
      { id: 'gen-ap', name: '无线 AP', icon: 'ap', brand: 'generic' },
      { id: 'gen-server', name: '服务器', icon: 'server', brand: 'generic' },
      { id: 'gen-cloud', name: 'Internet', icon: 'cloud', brand: 'generic' },
    ],
  },
]

const STORAGE_KEY = 'tvt-device-library-v5'

function normalizeBrand(brand?: string): DeviceBrand {
  if (brand === 'tvt') return 'tvt'
  return 'generic'
}

/** 将旧版分类合并 / 升级到最新默认库结构 */
function migrateLibrary(raw: unknown): DeviceCategory[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null

  const categories = raw as Array<{
    id: string
    name: string
    brand?: string
    items?: Array<{
      id: string
      name: string
      icon: DeviceIconType
      brand?: string
      custom?: boolean
    }>
  }>

  const result = structuredClone(defaultDeviceLibrary)
  const builtinIds = new Set(
    defaultDeviceLibrary.flatMap((c) => c.items.map((i) => i.id)),
  )

  for (const cat of categories) {
    // 跳过已删除的第三方分类内置项；自定义项并入通用网络
    const brand = normalizeBrand(cat.brand ?? cat.id)
    const target = result.find((c) => c.brand === brand)
    if (!target) continue

    for (const item of cat.items ?? []) {
      const itemBrand = normalizeBrand(item.brand ?? cat.brand)
      const dest = result.find((c) => c.brand === itemBrand) ?? target

      // 旧第三方内置项直接丢弃
      if (
        !item.custom &&
        (item.id.startsWith('third-') ||
          ['hik', 'dahua', 'unv', 'third'].includes(cat.id) ||
          ['hik', 'dahua', 'unv', 'third'].includes(cat.brand ?? ''))
      ) {
        continue
      }

      if (!item.custom && !builtinIds.has(item.id)) continue

      if (builtinIds.has(item.id) && item.custom) {
        dest.items = dest.items.map((i) =>
          i.id === item.id
            ? { ...i, name: item.name, icon: item.icon, custom: true }
            : i,
        )
        continue
      }

      if (!dest.items.some((i) => i.id === item.id) && item.custom) {
        dest.items.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          brand: itemBrand,
          custom: true,
        })
      }
    }
  }

  // TVT 设备类型仅保留有产品图片的图标；通用网络分类不受影响。
  const tvtCategory = result.find((category) => category.brand === 'tvt')
  if (tvtCategory) {
    tvtCategory.items = tvtCategory.items.filter((item) => tvtProductImageIcons.has(item.icon))
  }

  return result
}

export function loadDeviceLibrary(): DeviceCategory[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('tvt-device-library-v4') ??
      localStorage.getItem('tvt-device-library-v3') ??
      localStorage.getItem('tvt-device-library-v2') ??
      localStorage.getItem('tvt-device-library')
    if (!raw) return structuredClone(defaultDeviceLibrary)
    const parsed = JSON.parse(raw) as unknown
    const migrated = migrateLibrary(parsed)
    if (!migrated) return structuredClone(defaultDeviceLibrary)
    return migrated
  } catch {
    return structuredClone(defaultDeviceLibrary)
  }
}

export function saveDeviceLibrary(library: DeviceCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
}
