/**
 * SFTP Terminal UI
 * Full-screen terminal interface with file browser and console
 */

import blessed from 'blessed';
import { SFTPClient, FileInfo } from '../index';
import chalk from 'chalk';
import path from 'path';

export class SFTPTerminal {
  private client: SFTPClient;
  private config: any;
  private screen: any;
  private fileTable: any;
  private directoryTree: any;
  private consoleBox: any;
  private statusBar: any;
  private currentPath: string = '/';
  private files: FileInfo[] = [];
  private consoleLines: string[] = [];
  private selectedFileIndex: number = 0;

  constructor(client: SFTPClient, config: any) {
    this.client = client;
    this.config = config;
  }

  async start() {
    this.initializeScreen();
    await this.loadFiles(this.currentPath);
    this.screen.render();
  }

  private initializeScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'sftp.js',
      fullUnicode: true,
    });

    const headerHeight = 3;
    const statusHeight = 1;
    const consoleHeight = 10;
    const mainContentHeight = `100%-${headerHeight + statusHeight + consoleHeight}`;

    this.createHeader(headerHeight);
    this.createFileTable(headerHeight, mainContentHeight);
    this.createDirectoryTree(headerHeight, mainContentHeight);
    this.createConsole(consoleHeight);
    this.createStatusBar();

    this.setupKeyBindings();

    this.screen.key(['q', 'C-c'], () => {
      this.cleanup();
      return process.exit(0);
    });
  }

  private createHeader(height: number) {
    const header = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height,
      content: this.getHeaderContent(),
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true,
      },
    });

    this.screen.append(header);
  }

  private getHeaderContent(): string {
    const host = this.config.host || 'unknown';
    const username = this.config.username || 'unknown';
    return `{center}╔═══════════════════════════════════════════════════════════════════╗{/center}
{center}║  SFTP.JS - ${username}@${host}${' '.repeat(Math.max(0, 46 - username.length - host.length))}║{/center}
{center}╚═══════════════════════════════════════════════════════════════════╝{/center}`;
  }

  private createFileTable(top: number, height: string) {
    const container = blessed.box({
      top,
      left: 0,
      width: '60%',
      height,
      border: {
        type: 'line',
        fg: 'cyan',
      },
      style: {
        fg: 'white',
        border: {
          fg: 'cyan',
        },
      },
      label: ' Files ',
    });

    this.fileTable = blessed.listtable({
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      style: {
        header: {
          fg: 'blue',
          bold: true,
        },
        cell: {
          fg: 'white',
          selected: {
            bg: 'blue',
            fg: 'white',
            bold: true,
          },
        },
      },
      align: 'left',
      pad: 1,
      scrollbar: {
        ch: '█',
        style: {
          fg: 'cyan',
        },
      },
    });

    container.append(this.fileTable);
    this.screen.append(container);
  }

  private createDirectoryTree(top: number, height: string) {
    const container = blessed.box({
      top,
      left: '60%',
      width: '40%',
      height,
      border: {
        type: 'line',
        fg: 'cyan',
      },
      style: {
        fg: 'white',
        border: {
          fg: 'cyan',
        },
      },
      label: ' Directory Tree ',
    });

    this.directoryTree = blessed.box({
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '█',
        style: {
          fg: 'cyan',
        },
      },
      keys: true,
      vi: true,
      mouse: true,
    });

    container.append(this.directoryTree);
    this.screen.append(container);
  }

  private createConsole(height: number) {
    const container = blessed.box({
      bottom: 1,
      left: 0,
      width: '100%',
      height,
      border: {
        type: 'line',
        fg: 'yellow',
      },
      style: {
        fg: 'white',
        border: {
          fg: 'yellow',
        },
      },
      label: ' Console ',
    });

    this.consoleBox = blessed.log({
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '█',
        style: {
          fg: 'yellow',
        },
      },
      keys: true,
      vi: true,
      mouse: true,
    });

    container.append(this.consoleBox);
    this.screen.append(container);

    this.log('info', 'Terminal UI initialized');
    this.log('info', `Connected to ${this.config.host}`);
  }

  private createStatusBar() {
    this.statusBar = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
      },
    });

    this.screen.append(this.statusBar);
    this.updateStatusBar();
  }

  private updateStatusBar() {
    const keybinds = '[↑↓] Navigate | [Enter] Open | [d] Download | [u] Upload | [Del] Delete | [n] New Folder | [r] Rename | [q] Quit';
    this.statusBar.setContent(keybinds);
  }

  private setupKeyBindings() {
    this.fileTable.key(['up', 'k'], () => {
      this.fileTable.up();
      this.screen.render();
    });

    this.fileTable.key(['down', 'j'], () => {
      this.fileTable.down();
      this.screen.render();
    });

    this.fileTable.key(['enter'], async () => {
      await this.handleEnter();
    });

    this.fileTable.key(['backspace', 'left', 'h'], async () => {
      await this.goBack();
    });

    this.fileTable.key(['d'], async () => {
      await this.downloadSelected();
    });

    this.fileTable.key(['u'], async () => {
      await this.uploadFile();
    });

    this.fileTable.key(['delete'], async () => {
      await this.deleteSelected();
    });

    this.fileTable.key(['n'], async () => {
      await this.createFolder();
    });

    this.fileTable.key(['r'], async () => {
      await this.renameSelected();
    });

    this.fileTable.key(['f'], async () => {
      await this.refresh();
    });

    this.fileTable.focus();
  }

  private async loadFiles(dirPath: string) {
    try {
      this.log('info', `Loading files from: ${dirPath}`);

      const result = await this.client.list(dirPath);

      if (!result.success) {
        this.log('error', `Failed to load files: ${result.error}`);
        return;
      }

      this.currentPath = dirPath;
      this.files = result.data || [];

      this.updateFileTable();
      this.updateDirectoryTree();
      this.screen.render();

      this.log('success', `Loaded ${this.files.length} items`);
    } catch (error: any) {
      this.log('error', `Error loading files: ${error.message}`);
    }
  }

  private updateFileTable() {
    const headers = ['Type', 'Name', 'Size', 'Modified'];
    const data = this.files.map((file) => {
      const icon = file.type === 'd' ? '📁' : '📄';
      const size = file.type === 'd' ? '---' : this.formatFileSize(file.size);
      const date = this.formatDate(file.modifyTime);

      return [
        icon,
        file.name,
        size,
        date,
      ];
    });

    this.fileTable.setData([headers, ...data]);
  }

  private updateDirectoryTree() {
    const tree = this.buildDirectoryTree(this.currentPath);
    this.directoryTree.setContent(tree);
  }

  private buildDirectoryTree(currentPath: string): string {
    const parts = currentPath.split('/').filter((p) => p);
    let tree = '{cyan-fg}{bold}Directory Structure{/bold}{/cyan-fg}\n\n';
    tree += '{yellow-fg}📁 /{/yellow-fg}\n';

    for (let i = 0; i < parts.length; i++) {
      const indent = '  '.repeat(i + 1);
      const isLast = i === parts.length - 1;
      const branch = isLast ? '└─' : '├─';
      tree += `${indent}${branch} {cyan-fg}📁 ${parts[i]}{/cyan-fg}\n`;
    }

    tree += '\n{gray-fg}Folders in current directory:{/gray-fg}\n';
    const folders = this.files.filter((f) => f.type === 'd');

    if (folders.length === 0) {
      tree += '{gray-fg}  (no folders){/gray-fg}\n';
    } else {
      folders.forEach((folder, idx) => {
        const branch = idx === folders.length - 1 ? '└─' : '├─';
        tree += `  ${branch} 📁 {white-fg}${folder.name}{/white-fg}\n`;
      });
    }

    return tree;
  }

  private async handleEnter() {
    const selected = this.fileTable.selected;
    if (selected <= 0) return;

    const file = this.files[selected - 1];
    if (!file) return;

    if (file.type === 'd') {
      const newPath = path.posix.join(this.currentPath, file.name);
      await this.loadFiles(newPath);
    } else {
      this.log('info', `Selected file: ${file.name}`);
    }
  }

  private async goBack() {
    if (this.currentPath === '/') {
      this.log('warn', 'Already at root directory');
      return;
    }

    const newPath = path.posix.dirname(this.currentPath);
    await this.loadFiles(newPath);
  }

  private async downloadSelected() {
    const selected = this.fileTable.selected;
    if (selected <= 0) return;

    const file = this.files[selected - 1];
    if (!file) return;

    if (file.type === 'd') {
      this.log('warn', 'Directory download not yet implemented');
      return;
    }

    try {
      const remotePath = path.posix.join(this.currentPath, file.name);
      const localPath = path.join(process.cwd(), file.name);

      this.log('info', `Downloading: ${file.name}...`);

      const result = await this.client.get(remotePath, localPath);

      if (result.success) {
        this.log('success', `Downloaded to: ${localPath}`);
      } else {
        this.log('error', `Download failed: ${result.error}`);
      }
    } catch (error: any) {
      this.log('error', `Download error: ${error.message}`);
    }
  }

  private async uploadFile() {
    this.log('info', 'Upload feature: Select file from local system');
  }

  private async deleteSelected() {
    const selected = this.fileTable.selected;
    if (selected <= 0) return;

    const file = this.files[selected - 1];
    if (!file) return;

    try {
      const remotePath = path.posix.join(this.currentPath, file.name);

      this.log('warn', `Deleting: ${file.name}...`);

      let result;
      if (file.type === 'd') {
        result = await this.client.rmdir(remotePath, true);
      } else {
        result = await this.client.delete(remotePath);
      }

      if (result.success) {
        this.log('success', `Deleted: ${file.name}`);
        await this.loadFiles(this.currentPath);
      } else {
        this.log('error', `Delete failed: ${result.error}`);
      }
    } catch (error: any) {
      this.log('error', `Delete error: ${error.message}`);
    }
  }

  private async createFolder() {
    this.log('info', 'Create folder feature coming soon');
  }

  private async renameSelected() {
    this.log('info', 'Rename feature coming soon');
  }

  private async refresh() {
    await this.loadFiles(this.currentPath);
    this.log('info', 'Refreshed file list');
  }

  private log(level: 'info' | 'success' | 'warn' | 'error', message: string) {
    const timestamp = new Date().toLocaleTimeString();
    let color = 'white';
    let prefix = '•';

    switch (level) {
      case 'success':
        color = 'green';
        prefix = '✓';
        break;
      case 'warn':
        color = 'yellow';
        prefix = '⚠';
        break;
      case 'error':
        color = 'red';
        prefix = '✗';
        break;
    }

    const line = `{gray-fg}[${timestamp}]{/gray-fg} {${color}-fg}${prefix}{/${color}-fg} ${message}`;
    this.consoleBox.log(line);
    this.screen.render();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private cleanup() {
    if (this.client.isConnected()) {
      this.client.disconnect();
    }
    if (this.screen) {
      this.screen.destroy();
    }
  }
}