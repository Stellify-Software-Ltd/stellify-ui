import { build, context, type BuildOptions } from 'esbuild'
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const watch = process.argv.includes('--watch')

const buildOptions: BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/stellify-ui.js',
  sourcemap: true,
  minify: !watch,
  logLevel: 'info',
}

const tokenFiles = [
  'src/tokens/base.css',
  'src/tokens/themes/shadcn.css',
  'src/tokens/themes/editorial.css',
  'src/tokens/themes/neutral.css',
]

function copyTokens() {
  for (const file of tokenFiles) {
    const dest = file.replace(/^src\//, 'dist/')
    const dir = dirname(dest)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    copyFileSync(file, dest)
    console.log(`copied ${file} → ${dest}`)
  }
}

if (watch) {
  const ctx = await context(buildOptions)
  await ctx.watch()
  copyTokens()
  console.log('watching for changes…')
} else {
  await build(buildOptions)
  copyTokens()
  console.log('build complete')
}
