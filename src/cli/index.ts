#!/usr/bin/env node

/**
 * sftp.js CLI Tool
 * Full-screen terminal UI for SFTP operations
 */

import { program } from 'commander';
import { SFTPTerminal } from './terminal';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { SFTPClient } from '../index';

const packageJson = require('../../package.json');

async function showBanner() {
  console.clear();
  console.log(
    chalk.hex('#667eea').bold(
      figlet.textSync('SFTP.JS', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
      })
    )
  );
  console.log(chalk.gray(`v${packageJson.version}\n`));
}

async function promptConnection(): Promise<{
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'HOST:',
      default: 'localhost',
      validate: (input: string) => {
        if (!input.trim()) return 'Host is required';
        return true;
      },
    },
    {
      type: 'input',
      name: 'username',
      message: 'USERNAME:',
      validate: (input: string) => {
        if (!input.trim()) return 'Username is required';
        return true;
      },
    },
    {
      type: 'list',
      name: 'authMethod',
      message: 'AUTHENTICATION METHOD:',
      choices: ['Password', 'Private Key'],
      default: 'Password',
    },
    {
      type: 'password',
      name: 'password',
      message: 'PASSWORD:',
      when: (answers: any) => answers.authMethod === 'Password',
      mask: '*',
    },
    {
      type: 'input',
      name: 'privateKey',
      message: 'PRIVATE KEY PATH:',
      when: (answers: any) => answers.authMethod === 'Private Key',
    },
  ]);

  let host = answers.host;
  let port = 22;

  if (host.includes(':')) {
    const parts = host.split(':');
    host = parts[0];
    port = parseInt(parts[1]) || 22;
  }

  return {
    host,
    port,
    username: answers.username,
    password: answers.password,
    privateKey: answers.privateKey,
  };
}

async function connectAndLaunch() {
  await showBanner();

  console.log(chalk.cyan.bold('Connect to SFTP Server\n'));

  const config = await promptConnection();

  console.log(chalk.yellow('\nConnecting...'));

  const client = new SFTPClient();
  const result = await client.connect(config as any);

  if (!result.success) {
    console.log(chalk.red.bold('\n✗ Connection Failed'));
    console.log(chalk.red(result.error || 'Unknown error'));
    process.exit(1);
  }

  console.log(chalk.green.bold('✓ Connected Successfully'));
  console.log(chalk.gray('Launching terminal UI...\n'));

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const terminal = new SFTPTerminal(client, config);
  await terminal.start();
}

program
  .name('sftpjs')
  .description('Interactive SFTP client with full-screen terminal UI')
  .version(packageJson.version);

program
  .command('login')
  .alias('join')
  .description('Connect to SFTP server')
  .action(async () => {
    await connectAndLaunch();
  });

program
  .command('connect')
  .description('Connect to SFTP server')
  .option('-h, --host <host>', 'SFTP host')
  .option('-p, --port <port>', 'SFTP port', '22')
  .option('-u, --username <username>', 'Username')
  .option('-w, --password <password>', 'Password')
  .option('-k, --key <keyPath>', 'Private key path')
  .action(async (options) => {
    if (!options.host || !options.username) {
      console.log(chalk.red('Error: Host and username are required'));
      console.log(chalk.yellow('Use: sftpjs connect -h <host> -u <username> [-w <password>]'));
      process.exit(1);
    }

    await showBanner();

    const client = new SFTPClient();
    const result = await client.connect({
      host: options.host,
      port: parseInt(options.port),
      username: options.username,
      password: options.password,
      privateKey: options.key,
    });

    if (!result.success) {
      console.log(chalk.red.bold('✗ Connection Failed'));
      console.log(chalk.red(result.error || 'Unknown error'));
      process.exit(1);
    }

    console.log(chalk.green.bold('✓ Connected Successfully'));

    const terminal = new SFTPTerminal(client, {
      host: options.host,
      port: parseInt(options.port),
      username: options.username,
    });
    await terminal.start();
  });

if (process.argv.length === 2) {
  connectAndLaunch();
} else {
  program.parse();
}