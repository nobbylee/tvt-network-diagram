import type { ReactElement } from 'react'
import { brandColors } from '../data/deviceLibrary'
import ipcBulletImg from '../assets/devices/ipc-bullet.png'
import ipcDomeImg from '../assets/devices/ipc-dome.png'
import ptzImg from '../assets/devices/ptz.png'
import nvrImg from '../assets/devices/nvr.png'
import accessImg from '../assets/devices/access.png'
import mobileAppImg from '../assets/devices/mobile-app.png'

type DeviceIconProps = {
  type: string
  brand?: string
  size?: number
}

/** 实拍图图标（有产品图的类型优先用图片） */
export const photoIcons: Record<string, string> = {
  'ipc-bullet': ipcBulletImg,
  'ipc-dome': ipcDomeImg,
  ptz: ptzImg,
  nvr: nvrImg,
  dvr: nvrImg,
  access: accessImg,
  'mobile-app': mobileAppImg,
}

export function hasPhotoIcon(type: string, brand?: string) {
  if (brand && brand !== 'tvt') return false
  return type in photoIcons
}

function ServerRack({
  color,
  size,
  badge,
}: {
  color: string
  size: number
  badge: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="5" rx="1.2" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="10" width="16" height="5" rx="1.2" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="17" width="16" height="4" rx="1.2" stroke={color} strokeWidth="1.5" />
      <circle cx="7" cy="5.5" r="0.8" fill={color} />
      <circle cx="7" cy="12.5" r="0.8" fill={color} />
      <text
        x="16"
        y="13.2"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill={color}
      >
        {badge}
      </text>
    </svg>
  )
}

export function DeviceIcon({ type, brand = 'tvt', size = 24 }: DeviceIconProps) {
  const color =
    brand in brandColors
      ? brandColors[brand as keyof typeof brandColors]
      : brandColors.generic

  // TVT 有实拍图时优先显示产品图（略放大；录像机再大一档）
  if (brand === 'tvt' && type in photoIcons) {
    const scale = type === 'nvr' || type === 'dvr' ? 1.65 : 1.35
    const photoSize = Math.round(size * scale)
    return (
      <img
        src={photoIcons[type]}
        alt=""
        width={photoSize}
        height={photoSize}
        draggable={false}
        className="object-contain select-none"
        style={{ display: 'block', pointerEvents: 'none' }}
      />
    )
  }

  const icons: Record<string, ReactElement> = {
    'ipc-turret': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 16c0-4 2.5-7 6-7s6 3 6 7"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse cx="12" cy="16" rx="7" ry="3" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2.2" fill={color} opacity="0.3" />
      </svg>
    ),
    'ipc-fisheye': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.8" fill={color} opacity="0.35" />
      </svg>
    ),
    nvms: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="13" rx="2" stroke={color} strokeWidth="1.5" />
        <line x1="3" y1="20" x2="21" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="9" y1="17" x2="9" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="15" y1="17" x2="15" y2="20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    server: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <rect x="4" y="11" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="6" r="1" fill={color} />
        <circle cx="7" cy="14" r="1" fill={color} />
      </svg>
    ),
    'server-forward': <ServerRack color={color} size={size} badge="转" />,
    'server-storage': <ServerRack color={color} size={size} badge="存" />,
    'server-manage': <ServerRack color={color} size={size} badge="管" />,
    decoder: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M15 10 L20 8 L20 16 L15 14" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    ),
    videowall: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="13" y="5" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="3" y="13" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="13" y="13" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    switch: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="8" width="20" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        {[5, 8, 11, 14, 17].map((x) => (
          <rect key={x} x={x} y="10" width="2" height="4" rx="0.5" fill={color} opacity="0.4" />
        ))}
      </svg>
    ),
    router: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="10" width="16" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        <line x1="8" y1="10" x2="8" y2="6" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="10" x2="12" y2="5" stroke={color} strokeWidth="1.5" />
        <line x1="16" y1="10" x2="16" y2="6" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    firewall: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
          stroke={color}
          strokeWidth="1.5"
        />
        <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    pc: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M8 20h8M12 16v4" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    ap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="16" r="2" fill={color} opacity="0.35" stroke={color} strokeWidth="1.2" />
        <path d="M8 13a5.5 5.5 0 0 1 8 0" stroke={color} strokeWidth="1.5" />
        <path d="M5.5 10a9 9 0 0 1 13 0" stroke={color} strokeWidth="1.5" />
        <path d="M3.5 7a12 12 0 0 1 17 0" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    cloud: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6-1.5A3.5 3.5 0 0 0 7 18z"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    ),
    // 线稿回退（无实拍图时）
    'ipc-bullet': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="14" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M18 10 L22 8 L22 16 L18 14" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="12" r="2" fill={color} opacity="0.3" />
      </svg>
    ),
    'ipc-dome': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="8" ry="5" stroke={color} strokeWidth="1.5" />
        <path d="M12 9 L12 6" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2.5" fill={color} opacity="0.3" />
      </svg>
    ),
    ptz: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="8" y="16" width="8" height="4" rx="1" stroke={color} strokeWidth="1.5" />
        <ellipse cx="12" cy="11" rx="6" ry="5" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="11" r="2" fill={color} opacity="0.3" />
      </svg>
    ),
    nvr: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="12" r="1" fill={color} />
        <circle cx="11" cy="12" r="1" fill={color} />
        <line x1="14" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" />
        <line x1="14" y1="14" x2="17" y2="14" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    dvr: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="10" rx="2" stroke={color} strokeWidth="1.5" />
        <rect x="5" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
        <rect x="9" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
        <rect x="13" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
      </svg>
    ),
    access: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="16" x2="12" y2="18" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
  }

  return icons[type] ?? icons['ipc-bullet']
}
