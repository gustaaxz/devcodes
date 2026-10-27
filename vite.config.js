import react from '@vitejs/plugin-react'
import * as babel from '@babel/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { jsxI18nPlugin } from './src/utils/jsxI18nPlugin.js'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function localizeJsx() {
  return {
    name: 'devcodes-jsx-localization',
    enforce: 'pre',
    transform(source, id) {
      const filePath = id.split('?')[0]
      const normalizedPath = filePath.replace(/\\/g, '/')
      if (!/\.jsx$/.test(normalizedPath) || !normalizedPath.includes('/src/') || /\.test\.jsx$/.test(normalizedPath)) return null
      const result = babel.transformSync(source, {
        filename: filePath,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        parserOpts: { sourceType: 'module', plugins: ['jsx'] },
        plugins: [jsxI18nPlugin]
      })
      return { code: result.code, map: result.map }
    }
  }
}

export default defineConfig({
  plugins: [localizeJsx(), react()],
  resolve: {
    alias: {
      '@devcodes/LocalizedText': path.resolve(projectRoot, 'src/components/i18n/LocalizedText.jsx'),
      '@devcodes/i18n': path.resolve(projectRoot, 'src/utils/i18n.js')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}']
  }
})
