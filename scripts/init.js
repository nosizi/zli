const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const execa = require("execa");
const chalk = require('chalk')

const pkgFilePath = path.resolve(process.cwd(), "./package.json")
const hasPackageJson = fs.existsSync(pkgFilePath)
const dependencies = {
  devDeps: [],
  deps: []
}

let theAnswer = {
  hasPackageJson,
}

function getTargetPkgJsonOnParse() {
  return JSON.parse(
    fs.readFileSync(pkgFilePath, {
      encoding: "utf8",
    })
  );
}

function getTsDependencies(isNode) {
  const targetPkgFile = getTargetPkgJsonOnParse();
  const { dependencies, devDependencies } = targetPkgFile;

  const depArgs = [];
  const devDepArgs = [];
  const availableTs = dependencies && Reflect.has(dependencies, "typescript");
  const availableNodeTypes =
    devDependencies && Reflect.has(devDependencies, "@types/node");
  console.log({ isNode });

  if (isNode) {
    if (!availableNodeTypes) {
      devDepArgs.push("@types/node");
    }
  }

  if (!availableTs) {
    depArgs.push("typescript");
  }

  return {
    depArgs,
    devDepArgs,
  };
}

function setTsConfigFile(flag) {
  const configString = fs.readFileSync(
    path.resolve(__dirname, `../lib/config/${flag}.tsconfig.json`),
    {
      encoding: "utf8",
    }
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), "./tsconfig.json"),
    configString,
    { encoding: "utf8" }
  );
}

async function askFramework() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'What framework your?',
      choices: [
        'React',
        // 'Vue',
        // 'Node',
        // 'Vanilla'
      ],
      default: 'Vanilla',
    },
  ])
}

async function askTypescript() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Did you need Typescript?',
    },
  ])
}

async function askESLint() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'eslint',
      message: 'Did you need ESLint?',
    },
  ])
}

async function askESLintStyle() {
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

async function askStylelint() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'stylelint',
      message: 'Did you need stylelint?',
    },
  ])
}

async function askPrettier() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'prettier',
      message: 'Did you need Prettier?',
    },
  ])
}

async function askHusky() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'husky',
      message: 'Did you need git husky? It will add husky and lint-staged config.',
    }
  ])
}

function generateTSDeps(answer) {
  const map = {
    'React': {
      devDeps: [
        '@types/react',
      ],
      deps: [],
    },
    'Vue': {
      devDeps: [],
      deps: [],
    },
    'Node': {
      devDeps: [],
      deps: [],
    },
    'Vanilla': {
      devDeps: [],
      deps: [],
    },
  }

  dependencies.deps = [
    ...dependencies.deps,
    ...map[answer].deps,
  ]
  dependencies.devDeps = [
    ...dependencies.devDeps,
    ...map[answer].devDeps,
  ]
}

function generateESLintDeps(answer) {
  dependencise.devDeps.push('eslint')

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
    'eslint-plugin-import', // TODO: under nodejs project?
  ]
  const tsWithESLint = [
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
  ]

  const handler = (configArr) => {
    dependencise.devDeps = [
      ...dependencise.devDeps,
      ...configArr,
    ]
  }

  if (theAnswer.framework === 'React') {
    handler(reactWithESLint)
  }

  if (theAnswer.typescript) {
    handler(tsWithESLint)
  }

  if (theAnswer.eslintStyle === 'airbnb') {
    handler(airbnbWithESLint)
  }

  if (theAnswer.prettier) {
    handler(prettierWithESLint)
  }
}

async function initAction() {
  if (!theAnswer.hasPackageJson) {
    console.log('please run `npm init` first.');
    chalk.red('please run `npm init` first.');
    return
  }

  const { framework } = await askFramework()
  const { typescript } = await askTypescript()
  const { eslint } = await askESLint()

  if (eslint) {
    const { eslintStyle } = await askESLintStyle()
    theAnswer.eslintStyle = eslintStyle
  }

  const { stylelint } = await askStylelint()
  const { prettier } = await askPrettier()
  const { husky } = await askHusky()

  theAnswer = {
    ...theAnswer,
    framework,
    typescript,
    eslint,
    stylelint,
    prettier,
    husky,
  }

  if (typescript) {
    generateTSDeps(theAnswer.framework)
  }
  if (eslint) {
    generateESLintDeps()
  }



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
