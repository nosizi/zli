const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const execa = require("execa");
const chalk = require('chalk')

const pkgFilePath = path.resolve(process.cwd(), "./package.json")

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

function initAction() {
  inquirer
    .prompt([
      // {
      //   type: 'confirm',
      //   name: 'husky',
      //   message: 'husky?',
      // },
      // {
      //   type: 'confirm',
      //   name: 'lint-staged',
      //   message: 'lint-staged?',
      // },
      {
        type: "list",
        name: "tsconfig",
        message:
          "tsconfig.json? Choose and install typescript or not. If your dependencies doesn't have typescript and it will be install.",
        choices: ["No", "JavaScript", "Node"],
        default: "No",
      },
    ])
    .then(async (answers) => {
      const { tsconfig, husky } = answers;

      if (!fs.existsSync(pkgFilePath)) {
        chalk.red('This project initial not yet by npm init. Please execute command `npm init`')
        return
      }

      let finalDeps = [];
      let finalDevDeps = [];

      if (husky) {
        finalDevDeps = ["husky"];
      }

      let tsDeps = {};
      if (tsconfig && tsconfig !== "No") {
        tsDeps = getTsDependencies(tsconfig === "Node");
      }
      console.log(tsDeps);

      if (Reflect.has(tsDeps, "depArgs") && tsDeps.depArgs.length) {
        finalDeps = [...finalDeps, ...tsDeps.depArgs];
      }

      if (Reflect.has(tsDeps, "devDepArgs") && tsDeps.devDepArgs.length) {
        finalDevDeps = [...finalDevDeps, ...tsDeps.devDepArgs];
      }

      if (finalDeps.length) {
        await execa("npm", ["install", "--save", ...finalDeps]);
      }

      if (finalDevDeps.length) {
        await execa("npm", ["install", "--save-dev", ...finalDevDeps]);
      }
    });
}

module.exports = initAction;
