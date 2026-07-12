import { describe, expect, it } from 'vitest'
import { safeExportFilename } from './exportImage'

describe('safeExportFilename', () => {
  it('追加扩展名', () => {
    expect(safeExportFilename('项目A', '.png')).toBe('项目A.png')
    expect(safeExportFilename('项目A', 'pdf')).toBe('项目A.pdf')
  })

  it('已有扩展名不重复追加', () => {
    expect(safeExportFilename('a.png', '.png')).toBe('a.png')
  })

  it('替换非法文件名字符', () => {
    expect(safeExportFilename('a/b:c', '.narch')).toBe('a_b_c.narch')
  })

  it('空名回退 project', () => {
    expect(safeExportFilename('', '.png')).toBe('project.png')
  })
})
