#!/usr/bin/env node
import { Command } from 'commander'
const pkg = require('../package.json')

import lint from '../scripts/lint'

const program = new Command()
program.name('@oh').version(pkg.version, '-v --version')

program
  .command('create [project-name]')
  .description('项目构建')
  .option('-fix <value>', '修复代码')
  .action((name, options) => {
    console.log(name, options);
  })

program
  .command('lint')
  .description('lint files')
  .option('--staged', 'linters on files')
  .action(lint)

program.parse(process.argv)