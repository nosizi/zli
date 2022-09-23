const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { Buffer } = require('buffer')
const execa = require("execa");
const chalk = require('chalk');

const eslintLibConfig = require('../lib/eslintrc')

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

    // set all answer...
    this.theAnswer = {
      ...this.theAnswer,
      framework,
      typescript,
      eslint,
      stylelint,
      prettier,
      husky,
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
    console.log(this.dependencies);

    // write files in the end
    if (eslint) {
      this.writeESLintConfigFile()
    }
    // if (typescript) {
    //   this.writeTSConfigFile()
    // }
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

  static generateTSDeps() {
    const { framework } = this.theAnswer
    console.log(this.tsDepsMap[framework]);
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
      fs.writeFile('tsconfig.previous.json', data, {
        encoding: 'utf-8',
      }, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      })
    }

    const libData = new Uint8Array(Buffer.from(libConfig))
    fs.writeFile('tsconfig.json', libData, {
      encoding: 'utf-8',
    }, (err) => {
      if (err) throw err
      console.log('tsconfig.json has been saved!')
    })
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
    console.log(eslintLibConfig);
  }
}

function getTargetPkgJsonOnParse() {
  return JSON.parse(
    fs.readFileSync(pkgFilePath, {
      encoding: "utf8",
    })
  );
}

async function initAction() {
  if (!theAnswer.hasPackageJson) {
    console.log('please run `npm init` first.');
    chalk.red('please run `npm init` first.');
    return
  }

  Initial.initActions()
  // inquirer.prompt([
  //     {
  //       type: 'confirm',
  //       name: 'husky',
  //       message: 'husky?',
  //     },
  //     {
  //       type: 'confirm',
  //       name: 'lint-staged',
  //       message: 'lint-staged?',
  //     },
  //     {
  //       type: "list",
  //       name: "tsconfig",
  //       message:
  //         "tsconfig.json? Choose and install typescript or not. If your dependencies doesn't have typescript and it will be install.",
  //       choices: ["No", "JavaScript", "Node"],
  //       default: "No",
  //     },
  //   ])
    // .then(async (answers) => {
    //   const { tsconfig, husky } = answers;

    //   if (!fs.existsSync(pkgFilePath)) {
    //     chalk.red('This project initial not yet by npm init. Please execute command `npm init`')
    //     return
    //   }

    //   let finalDeps = [];
    //   let finalDevDeps = [];

    //   if (husky) {
    //     finalDevDeps = ["husky"];
    //   }

    //   let tsDeps = {};
    //   if (tsconfig && tsconfig !== "No") {
    //     tsDeps = getTsDependencies(tsconfig === "Node");
    //   }
    //   console.log(tsDeps);

    //   if (Reflect.has(tsDeps, "depArgs") && tsDeps.depArgs.length) {
    //     finalDeps = [...finalDeps, ...tsDeps.depArgs];
    //   }

    //   if (Reflect.has(tsDeps, "devDepArgs") && tsDeps.devDepArgs.length) {
    //     finalDevDeps = [...finalDevDeps, ...tsDeps.devDepArgs];
    //   }

    //   if (finalDeps.length) {
    //     await execa("npm", ["install", "--save", ...finalDeps]);
    //   }

    //   if (finalDevDeps.length) {
    //     await execa("npm", ["install", "--save-dev", ...finalDevDeps]);
    //   }
    // });
}

module.exports = initAction;
