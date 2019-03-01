#!/usr/bin/env node

const { existsSync } = require('fs');
const { join } = require('path');
const yParser = require('yargs-parser');
const chalk = require('chalk');
const signale = require('signale');

// print version and @local
const args = yParser(process.argv.slice(2));
if (args.v || args.version) {
  console.log(require('../package').version);
  if (existsSync(join(__dirname, '../.local'))) {
    console.log(chalk.cyan('@local'));
  }
  process.exit(0);
}

// Notify update when process exits
const updater = require('update-notifier');
const pkg = require('../package.json');
updater({ pkg }).notify({ defer: true });

switch (args._[0]) {
  case 'build':
    build();
    break;
  case 'help':
  case undefined:
    printHelp();
    break;
  default:
    console.error(chalk.red(`Unsupported command ${args._[0]}`));
    process.exit(1);
}

function stripEmptyKeys(obj) {
  return Object.keys(obj).reduce((memo, key) => {
    if (!memo[key] || (Array.isArray(memo[key] && !memo[key].length))) {
      delete memo[key];
    }
    return memo;
  }, {});
}

function build() {
  // Parse buildArgs from cli
  const buildArgs = stripEmptyKeys({
    esm: { type: args.esm === true ? 'rollup' : args.esm },
    cjs: { type: args.cjs === true ? 'rollup' : args.cjs },
    umd: args.umd,
    file: args.file,
    entry: args._.slice(1),
  });

  if (buildArgs.file && buildArgs.entry && buildArgs.entry.length > 1) {
    signale.error(new Error(
      `Cannot specify file when have multiple entries (${buildArgs.entry.join(', ')})`
    ));
    process.exit(1);
  }

  require('../lib/build').default({
    cwd: process.cwd(),
    watch: args.w || args.watch,
    buildArgs,
  }).catch(e => {
    signale.error(e);
    process.exit(1);
  });
}

function printHelp() {
  console.log(`
  Usage: umi-library <command> [options]

  Commands:

    ${chalk.green('build')}       build library
  `);
}
