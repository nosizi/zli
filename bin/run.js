#!/usr/bin/env node
const { Command } = require('commander')
const initAction = require('../scripts/init')

const pkgJson = require('../package.json')

const program = new Command()
program.name('zi').version(pkgJson.version, '-v --version')

program
  .command('init')
  .description('init husk, lint-staged, config, editorconfig.')
  .action(() => {
    initAction()
  })


program.parse(process.argv)