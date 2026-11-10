import { validateProject } from '@blog/config/node'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '../..')
const { errors, warnings } = validateProject(root)

for (const warning of warnings) {
  console.warn(`[config] ${warning.file}: ${warning.message}`)
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[config] ${error.file}: ${error.message}`)
  }
  console.error(`\n站点配置校验失败（${errors.length} 个错误），已中止构建。`)
  process.exit(1)
}

console.log(`站点配置校验通过（${warnings.length} 个警告）。`)
