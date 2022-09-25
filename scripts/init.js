const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { Buffer } = require('buffer')
const execa = require("execa");
const spawn = require('cross-spawn')
const chalk = require('chalk');
const stringify = require('json-stable-stringify-without-jsonify')

// config files
const eslintLibConfig = require('../lib/eslintrc');
const stylelintLibConfig = require('../lib/stylelint')
const prettierLibConfig = require('../lib/prettier.json')
const editorConfig = require('../lib/editorconfig')

const pkgFilePath = path.resolve(process.cwd(), "./package.json")
const hasPackageJson = fs.existsSync(pkgFilePath)


let theAnswer = {
  hasPackageJson,
}

class Initial {
  static theAnswer = {}
  static dependencies = {
    deps: [],
    devDeps: [],
  }
  static tsDepsMap = {
    'React': {
      devDeps: [
        '@types/react',
      ],
      deps: [],
    },
  }
  static isReact = false
  static isNode = false
  static isVanilla = false

  static async initActions() {
    const { framework } = await this.getAskFramework()

    if (framework !== 'Node') {
      const { env } = await this.getAskEnv()
      this.theAnswer.env = env
    }

    const { typescript } = await this.getAskTypesScript()
    const { eslint } = await this.getAskESLint()

    if (eslint) {
      const { eslintStyle } = await this.getAskESLintStyle()
      this.theAnswer.eslintStyle = eslintStyle
    }

    const { stylelint } = await this.getAskStylelint()
    const { prettier } = await this.getAskPrettier()
    const { husky } = await this.getAskHusky()
    const { editorconfig } = await this.getAskEditorConfig()
    const { pkgManager } = await this.getAskPackageManager()

    // set all answer...
    this.theAnswer = {
      ...this.theAnswer,
      framework,
      typescript,
      eslint,
      stylelint,
      prettier,
      husky,
      pkgManager,
    }

    if (framework === 'React') this.isReact = true
    console.log(this.theAnswer);

    // generate dependencies
    if (typescript) {
      this.generateTSDeps()
    }

    if (eslint) {
      this.generateESLintDeps()
    }

    if (stylelint) {
      this.generateStylelintDeps()
    }

    if (prettier) {
      this.generatePrettierDeps()
    }
    console.log(this.dependencies);

    // add husky
    if (husky) {
      this.generateHusky()
    }

    // install dependencies
    this.installDependencies()

    // write files in the end
    if (eslint) {
      this.writeESLintConfigFile()
    }
    if (typescript) {
      this.writeTSConfigFile()
    }
    if (prettier) {
      this.writePrettierConfigFile()
    }
    if (stylelint) {
      this.writeStylelintConfigFile()
    }
    if (editorconfig) {
      this.writeEditorConfigFile()
    }
    console.log('All config files has been created!');
    console.log('You can install it all now by manual.');
  }

  static async installDependencies() {
    const { devDeps } = this.dependencies
    const { pkgManager } = this.theAnswer
    const installCommand = pkgManager === 'yarn' ? 'add' : 'install'
    const res = spawn.sync(
      pkgManager,
      [installCommand, '-D'].concat(devDeps)
    )
    if (res.error) {
      console.log('Could not execute install command, please re-run again.');
    }
  }

  static async getAskEnv() {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'env',
        message: 'What environment your application run for',
        choices: [
          'browser',
          'weChatMiniApp',
        ],
        default: 'browser',
      }
    ])
  }

  static async getAskFramework() {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'What framework your?',
        choices: [
          'React',
          // TODO: more support
          // 'Vue',
          // 'Node',
          // 'Vanilla'
        ],
        default: 'React',
      },
    ])
  }

  static async getAskTypesScript() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Did you need TypeScript?',
      },
    ])
  }

  static async getAskESLint() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'eslint',
        message: 'Did you need ESLint?',
      },
    ])
  }

  static async getAskESLintStyle() {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'eslintStyle',
        message: 'Which style guide for your ESLint?',
        choices: ['Airbnb', 'Standard', 'default'],
        default: 'Airbnb',
      },
    ])
  }

  static async getAskStylelint() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'stylelint',
        message: 'Did you need stylelint?',
      },
    ])
  }

  static async getAskPrettier() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'prettier',
        message: 'Did you need Prettier?',
      },
    ])
  }

  static async getAskHusky() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'husky',
        message: 'Did you need git husky? It will add husky and lint-staged config.',
      }
    ])
  }

  static async getAskPackageManager() {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'pkgManager',
        message: 'Which package manager you want to use?',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm',
      }
    ])
  }

  static async getAskEditorConfig() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'editorconfig',
        message: 'Create .editorconfig?',
        default: true,
      }
    ])
  }

  static async getAskInstall() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: 'Install dependencies or just create config files',
        default: false,
      }
    ])
  }

  static generateTSDeps() {
    const { framework } = this.theAnswer
    this.dependencies.deps = [
      ...this.dependencies.deps,
      ...this.tsDepsMap[framework].deps,
    ]
    this.dependencies.devDeps = [
      ...this.dependencies.devDeps,
      ...this.tsDepsMap[framework].devDeps,
    ]
  }

  static generateESLintDeps() {
    this.dependencies.devDeps.push('eslint')

    const prettierWithESLint = [
      'eslint-config-prettier',
      'eslint-plugin-prettier',
    ]
    const airbnbWithESLint = [
      'eslint-config-airbnb',
      'eslint-config-airbnb-typescript',
    ]
    const reactWithESLint = [
      'eslint-plugin-react',
      'eslint-plugin-jsx-a11y',
      'eslint-plugin-react-hooks',
      'eslint-plugin-import',
    ]
    const tsWithESLint = [
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
    ]

    const handler = (configArr) => {
      this.dependencies.devDeps = [
        ...this.dependencies.devDeps,
        ...configArr,
      ]
    }

    const {
      typescript,
      eslintStyle,
      prettier,
    } = this.theAnswer

    if (this.isReact) handler(reactWithESLint)
    if (typescript) handler(tsWithESLint)
    if (eslintStyle === 'Airbnb') handler(airbnbWithESLint)
    if (prettier) handler(prettierWithESLint)
  }

  static generateStylelintDeps() {
    this.dependencies.devDeps = [
      ...this.dependencies.devDeps,
      'stylelint',
      'stylelint-config-standard',
      (this.theAnswer.prettier && 'stylelint-config-prettier'),
    ]
  }

  static generatePrettierDeps() {
    this.dependencies.devDeps.push('prettier')
  }

  // maybe run it after pkgManager install
  static generateHusky() {
    const { pkgManager } = this.theAnswer
    // const installCommand = pkgManager === 'yarn' ? 'add' : 'install'
    const useYarn = pkgManager === 'yarn'
    // install husky
    spawn.sync('npx', ['husky-init'])
    spawn.sync(pkgManager, [useYarn ? '' : 'install'])

  }

  static writePackageJSON() {
    try {
      const pkg = JSON.parse(fs.readFileSync(
        path.resolve(process.cwd(), 'package.json'),
        'utf-8',
      ))
      pkg.devDependencies = {
        ...(pkg.devDependencies || {}),
        ...this.dependencies.devDeps,
      }
      console.log(pkg);
    } catch (err) {
      console.log(err);
    }
  }

  static writeTSConfigFile() {
    let prefix = ''
    switch (this.theAnswer.framework) {
      case 'React':
      default:
        prefix = 'javascript'
        break
      case 'Node':
        prefix = 'node'
        break
    }

    const configPath = path.resolve(
      __dirname,
      '..',
      `lib/config/${prefix}.tsconfig.json`
    )
    const alreadyPath = path.resolve(process.cwd(), './tsconfig.json')

    const libConfig = fs.readFileSync(
      configPath, { encoding: 'utf-8' }
    )

    const alreadyTSConfigFile = fs.existsSync(alreadyPath)
    let alreadyConfigFile = {}
    if (alreadyTSConfigFile) {
      alreadyConfigFile = fs.readFileSync(
        alreadyPath, { encoding: 'utf-8' }
      )
      const data = new Uint8Array(Buffer.from(alreadyConfigFile))
      fs.writeFileSync('tsconfig.previous.json', data, 'utf-8')
    }

    const libData = new Uint8Array(Buffer.from(libConfig))
    fs.writeFileSync('tsconfig.json', libData, 'utf-8')
  }

  static writeESLintConfigFile() {
    const { env, eslintStyle, typescript, prettier } = this.theAnswer

    const rules = {}
    const extendsList = []
    const plugins = []

    if (env === 'browser') {
      eslintLibConfig.env['browser'] = true
    }

    if (this.isReact) {
      extendsList.push('plugin:import/recommended')
      extendsList.push('plugin:react/recommended')
      extendsList.push('plugin:react-hooks/recommended')
      eslintLibConfig.parserOptions.ecmaFeatures.jsx = true
      plugins.push('react')
      plugins.push('react-hooks')

      rules['react/jsx-uses-react'] = 'off'
      rules['react/react-in-jsx-scope'] = 'off'
      rules['react/jsx-filename-extension'] = 'off'

      rules['react-hooks/exhaustive-deps'] = 'off'

      rules['jsx-quotes'] = ['error', 'prefer-double']

      rules['import/no-common-js'] = 'off'
      rules['import/extensions'] = 'off'
    }

    if (eslintStyle === 'Airbnb' && typescript) {
      extendsList.push('airbnb-typescript')
    }

    if (prettier) {
      extendsList.push('prettier')
      plugins.push('prettier')
    }

    // config ts for eslint
    if (typescript) {
      extendsList.push('plugin:@typescript-eslint/recommended')
      eslintLibConfig.parser = '@typescript-eslint/parser'
      eslintLibConfig.parserOptions.project.push('./tsconfig.json')
      plugins.push('@typescript-eslint')

      rules['@typescript-eslint/semi'] = 'off'
      rules['@typescript-eslint/indent'] = ['error', 2]
      rules['@typescript-eslint/no-var-requires'] = 'off'
      rules['@typescript-eslint/ban-ts-comment'] = 'off'
    } else {
      extendsList.push('eslint:recommended')
    }

    eslintLibConfig.plugins = plugins
    eslintLibConfig.extends = extendsList
    eslintLibConfig.rules = rules

    const stringifiedConfig = `module.exports = ${
      stringify(eslintLibConfig, {
        cmp: function(a, b) {
          return a.key > b.key ? 1 : -1
        },
        space: 2,
      })
    }\n`

    fs.writeFileSync('.eslintrc.js', stringifiedConfig, 'utf-8')
  }

  static writeStylelintConfigFile() {
    if (this.theAnswer.prettier) {
      stylelintLibConfig.extends.push('stylelint-config-prettier')
    }
    const stringifiedConfig = stringify(stylelintLibConfig, {
      space: 2,
    })
    fs.writeFileSync('.stylelintrc.json', stringifiedConfig, 'utf-8')
  }

  static writePrettierConfigFile() {
    fs.writeFileSync('.prettierrc.json', stringify(prettierLibConfig, { space: 2 }), 'utf-8')
  }

  static writeEditorConfigFile() {
    fs.writeFileSync('.editorconfig', editorConfig, 'utf-8')
  }
}

async function initAction() {
  if (!theAnswer.hasPackageJson) {
    console.log('please run `npm init` first.');
    chalk.red('please run `npm init` first.');
    return
  }

  // Initial.writePackageJSON()
  Initial.initActions()
}

module.exports = initAction;
