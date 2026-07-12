/** 校验严重级别 */
export type Severity = 'error' | 'warning'

/** 校验规则标识 */
export type RuleId =
  | 'ip-format'
  | 'ip-conflict'
  | 'ip-subnet'
  | 'nvr-channels'
  | 'nvr-channels-missing'
  | 'poe-budget'
  | 'poe-headroom'
  | 'poe-ports'
  | 'poe-unestimated'
  | 'vlan-mix'

/** 单条校验问题 */
export type ValidationIssue = {
  id: string
  rule: RuleId
  severity: Severity
  message: string
  nodeIds?: string[]
  edgeIds?: string[]
  /** 是否使用了默认功耗等估算 */
  estimated?: boolean
}
