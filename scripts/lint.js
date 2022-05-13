import fs  from 'fs'
import stylelint from 'stylelint'
import { ESLint } from 'eslint'
import prettier from 'prettier'
// const lintStaged = require('lint-staged')
import lintStaged from 'lint-staged'

function lintCode(filesStr, fix) {
  const files = filesStr ? filesStr.split(' ') : null
  const eslint = new ESLint({
    fix,
    cache: true,
    cwd: process.cwd(),
    baseConfig: {},
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  })
}

async function lint(options) {
  const { staged, files } = options

  if (staged) {
    const res = await lintStaged({
      config: {
        relative: true,
        '**/*.{css,scss,sass,less,js,jsx,ts,tsx.json}': (filenames) => `@oh lint --files '${filenames.join(' ')}'`
      }
    })
    process.exit(Number(!res))
  } else {
    await lintCode(files)
  }
}

export default lint
