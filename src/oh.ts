#!/usr/bin/env node

import { Command } from 'commander'

const packageJSON = require('../package.json')
const program = new Command().version(packageJSON.version)

program
  .command('lint')
  .option('--init', 'initial configuration')
  .option('--no-fix', 'do not fix errors')
  .option('--staged', 'linters on git staged files')
  .option('files <string>', 'linters on files')
  .option('--commit <string>', 'lint git commit message')
  .option('lint and format code.')
  // .action()