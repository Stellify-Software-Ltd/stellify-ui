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

const cssFiles = [
  'src/tokens/base.css',
  'src/components/st-sidebar.css',
  'src/components/st-frame.css',
  'src/components/st-dialog.css',
]

function copyCss() {
  for (const file of cssFiles) {
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
  copyCss()
  console.log('watching for changes…')
} else {
  await build(buildOptions)
  copyCss()
  console.log('build complete')
}
