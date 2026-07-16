import type { ReactElement } from 'react'

type DeviceIconProps = {
  type: string
  size?: number
}

function RecorderImage({ size }: { size: number }) {
  return (
    <img
      src="/product-icons/recorder-transparent.png"
      width={size}
      height={size}
      alt="录像机"
      draggable={false}
      style={{ display: 'block', objectFit: 'contain', transform: 'scale(1.55)' }}
    />
  )
}

function PtzImage({ size }: { size: number }) {
  return (
    <img
      src="/product-icons/ptz-transparent.png"
      width={size}
      height={size}
      alt="球机"
      draggable={false}
      style={{ display: 'block', objectFit: 'contain', transform: 'scale(1.25)' }}
    />
  )
}

function ProductImage({
  src,
  alt,
  size,
  scale = 1.25,
}: {
  src: string
  alt: string
  size: number
  scale?: number
}) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      style={{ display: 'block', objectFit: 'contain', transform: `scale(${scale})` }}
    />
  )
}

export function DeviceIcon({ type, size = 24 }: DeviceIconProps) {
  const color = 'var(--ink)'

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
    nvms: <ProductImage src="/product-icons/nvms-platform.png" alt="NVMS 平台" size={size} scale={1.1} />,
    server: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <rect x="4" y="11" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="6" r="1" fill={color} />
        <circle cx="7" cy="14" r="1" fill={color} />
      </svg>
    ),
    'server-forward': <ProductImage src="/product-icons/server-forward-transparent.png" alt="流媒体服务器" size={size} scale={1.55} />,
    'server-storage': <ProductImage src="/product-icons/server-storage-transparent.png" alt="存储服务器" size={size} />,
    'server-manage': <ProductImage src="/product-icons/server-manage-transparent.png" alt="管理服务器" size={size} scale={1.55} />,
    decoder: <ProductImage src="/product-icons/decoder-transparent.png" alt="解码器" size={size} scale={1.35} />,
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
    'ipc-bullet': (
      <img
        src="/product-icons/ipc-bullet-transparent.png"
        width={size}
        height={size}
        alt="筒形 IPC"
        draggable={false}
        style={{ display: 'block', objectFit: 'contain', transform: 'scale(1.28)' }}
      />
    ),
    'ipc-dome': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="8" ry="5" stroke={color} strokeWidth="1.5" />
        <path d="M12 9 L12 6" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2.5" fill={color} opacity="0.3" />
      </svg>
    ),
    ptz: <PtzImage size={size} />,
    nvr: <RecorderImage size={size} />,
    dvr: <RecorderImage size={size} />,
    access: <ProductImage src="/product-icons/access-outdoor-transparent.png" alt="室外门禁" size={size} scale={0.88} />,
    'control-keyboard': <ProductImage src="/product-icons/control-keyboard-transparent.png" alt="控制键盘" size={size} scale={1.5} />,
    'intercom-indoor': <ProductImage src="/product-icons/intercom-indoor-transparent.png" alt="室内对讲机" size={size} scale={1.4} />,
    'mobile-app': <ProductImage src="/product-icons/mobile-app.png" alt="手机 App" size={size} scale={1.1} />,
  }

  return icons[type] ?? icons['ipc-bullet']
}
