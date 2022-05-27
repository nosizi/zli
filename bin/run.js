#!/usr/bin/env node
const { Command } = require('commander')
const fs = require('fs')

const pkgJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)))

const program = new Command()
program.name('zi').version(pkgJson.version, '-v --version')

program
  .command('create [project-name]')
  .description('项目构建')
  .option('-fix <value>', '修复代码')
  .action((name, options) => {
    console.log(name, options);
  })


program.parse(process.argv)