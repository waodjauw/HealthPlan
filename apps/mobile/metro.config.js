/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// monorepo：让 Metro 能看到根 node_modules 与 packages/core
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// 注意：不能用 disableHierarchicalLookup=true —— pnpm 布局下 expo 的
// 隐式依赖（expo-asset 等）位于 .pnpm/<pkg>/node_modules，需允许层级上溯解析。
// config.resolver.disableHierarchicalLookup = true

module.exports = config
