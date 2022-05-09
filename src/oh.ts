#!/usr/bin/env node

import { Command } from 'commander'
import lint from './commands/lint'

const packageJSON = require('../package.json')
console.log(packageJSON.version);

const program = new Command().version(packageJSON.version)

program
  .command('lint')
  .action(lint)