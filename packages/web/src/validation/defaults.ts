/** 图标级默认 PoE 功耗（瓦）；未列出的图标不估算 */
export const DEFAULT_POWER_DRAW_W: Readonly<Record<string, number>> = {
  'ipc-bullet': 7,
  'ipc-dome': 7,
  'ipc-turret': 7,
  'ipc-fisheye': 10,
  ptz: 18,
  access: 8,
}

/** 按图标查默认功耗；无默认则返回 null */
export function defaultPowerDrawW(icon: string): number | null {
  return DEFAULT_POWER_DRAW_W[icon] ?? null
}
