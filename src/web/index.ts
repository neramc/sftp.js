/**
 * sftp.js Web UI Library
 * Embeddable SFTP file manager for web applications
 */

import './styles.css';

export interface WebUIOptions {
  container: string | HTMLElement;
  apiEndpoint: string;
  theme?: 'light' | 'dark';
  onReady?: () => void;
  onError?: (error: Error) => void;
  onFileSelect?: (file: any) => void;
  onPathChange?: (path: string) => void;
}

export interface FileItem {
  type: 'd' | '-' | 'l';
  name: string;
  size: number;
  modifyTime: number;
}

export class WebUI {
  private container: HTMLElement;
  private options: WebUIOptions;
  private currentPath: string = '/';
  private files: FileItem[] = [];
  private selectedIndex: number = -1;

  constructor(options: WebUIOptions) {
    this.options = options;

    const el =
      typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;

    if (!el) {
      throw new Error('Container not found');
    }

    this.container = el as HTMLElement;
    this.init();
  }

  private init() {
    this.container.className = 'sftpjs-container';
    if (this.options.theme) {
      this.container.setAttribute('data-theme', this.options.theme);
    }

    this.render();
    this.loadFiles('/');

    if (this.options.onReady) {
      this.options.onReady();
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="sftpjs-header">
        <div class="sftpjs-logo">📁 SFTP.JS</div>
        <div class="sftpjs-path">
          <span class="sftpjs-path-label">Path:</span>
          <code class="sftpjs-path-value">${this.currentPath}</code>
        </div>
      </div>

      <div class="sftpjs-toolbar">
        <button class="sftpjs-btn sftpjs-btn-secondary" data-action="back">
          ← Back
        </button>
        <button class="sftpjs-btn sftpjs-btn-secondary" data-action="refresh">
          🔄 Refresh
        </button>
        <button class="sftpjs-btn sftpjs-btn-primary" data-action="mkdir">
          ➕ New Folder
        </button>
        <button class="sftpjs-btn sftpjs-btn-success" data-action="upload">
          ⬆️ Upload
        </button>
      </div>

      <div class="sftpjs-main">
        <div class="sftpjs-files">
          <div class="sftpjs-loading">Loading...</div>
        </div>
        <div class="sftpjs-tree">
          <div class="sftpjs-tree-title">Directory Tree</div>
          <div class="sftpjs-tree-content"></div>
        </div>
      </div>

      <div class="sftpjs-console">
        <div class="sftpjs-console-title">Console</div>
        <div class="sftpjs-console-content"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    this.container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action');
        this.handleAction(action!);
      });
    });
  }

  private async handleAction(action: string) {
    switch (action) {
      case 'back':
        await this.goBack();
        break;
      case 'refresh':
        await this.refresh();
        break;
      case 'mkdir':
        await this.createFolder();
        break;
      case 'upload':
        await this.uploadFile();
        break;
    }
  }

  private async loadFiles(path: string) {
    try {
      this.log('Loading files...');

      const response = await fetch(
        `${this.options.apiEndpoint}/files?path=${encodeURIComponent(path)}`
      );
      const data = await response.json();

      if (data.success) {
        this.currentPath = path;
        this.files = data.data || [];
        this.updateUI();
        this.log(`Loaded ${this.files.length} items`);

        if (this.options.onPathChange) {
          this.options.onPathChange(path);
        }
      } else {
        throw new Error(data.error || 'Failed to load files');
      }
    } catch (error: any) {
      this.log(`Error: ${error.message}`, 'error');
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  private updateUI() {
    this.updateFileList();
    this.updateTree();
    this.updatePathDisplay();
  }

  private updateFileList() {
    const filesEl = this.container.querySelector('.sftpjs-files');
    if (!filesEl) return;

    if (this.files.length === 0) {
      filesEl.innerHTML = '<div class="sftpjs-empty">No files</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'sftpjs-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Type</th>
        <th>Name</th>
        <th>Size</th>
        <th>Modified</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    this.files.forEach((file, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'sftpjs-file-row';
      tr.dataset.index = idx.toString();

      const icon = file.type === 'd' ? '📁' : '📄';
      const size = file.type === 'd' ? '—' : this.formatSize(file.size);
      const date = this.formatDate(file.modifyTime);

      tr.innerHTML = `
        <td>${icon}</td>
        <td>
          ${
            file.type === 'd'
              ? `<button class="sftpjs-folder-btn" data-action="open" data-index="${idx}">${file.name}</button>`
              : `<span>${file.name}</span>`
          }
        </td>
        <td>${size}</td>
        <td>${date}</td>
        <td>
          <div class="sftpjs-actions">
            ${
              file.type !== 'd'
                ? `<button class="sftpjs-btn-icon" data-action="download" data-index="${idx}" title="Download">⬇️</button>`
                : ''
            }
            <button class="sftpjs-btn-icon" data-action="rename" data-index="${idx}" title="Rename">✏️</button>
            <button class="sftpjs-btn-icon sftpjs-btn-danger" data-action="delete" data-index="${idx}" title="Delete">🗑️</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    filesEl.innerHTML = '';
    filesEl.appendChild(table);

    this.attachFileListeners();
  }

  private attachFileListeners() {
    this.container.querySelectorAll('[data-action="open"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index!);
        this.openFolder(idx);
      });
    });

    this.container.querySelectorAll('[data-action="download"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index!);
        this.downloadFile(idx);
      });
    });

    this.container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index!);
        this.deleteFile(idx);
      });
    });

    this.container.querySelectorAll('[data-action="rename"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index!);
        this.renameFile(idx);
      });
    });
  }

  private updateTree() {
    const treeEl = this.container.querySelector('.sftpjs-tree-content');
    if (!treeEl) return;

    const parts = this.currentPath.split('/').filter((p) => p);
    let html = '<div class="sftpjs-tree-item">📁 /</div>';

    for (let i = 0; i < parts.length; i++) {
      const indent = '&nbsp;&nbsp;'.repeat(i + 1);
      html += `<div class="sftpjs-tree-item">${indent}└─ 📁 ${parts[i]}</div>`;
    }

    const folders = this.files.filter((f) => f.type === 'd');
    if (folders.length > 0) {
      html += '<div class="sftpjs-tree-separator"></div>';
      folders.forEach((folder) => {
        html += `<div class="sftpjs-tree-item">&nbsp;&nbsp;📁 ${folder.name}</div>`;
      });
    }

    treeEl.innerHTML = html;
  }

  private updatePathDisplay() {
    const pathEl = this.container.querySelector('.sftpjs-path-value');
    if (pathEl) {
      pathEl.textContent = this.currentPath;
    }
  }

  private async openFolder(index: number) {
    const file = this.files[index];
    if (!file || file.type !== 'd') return;

    const newPath =
      this.currentPath === '/' ? `/${file.name}` : `${this.currentPath}/${file.name}`;
    await this.loadFiles(newPath);
  }

  private async goBack() {
    if (this.currentPath === '/') {
      this.log('Already at root');
      return;
    }

    const parts = this.currentPath.split('/').filter((p) => p);
    parts.pop();
    const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    await this.loadFiles(newPath);
  }

  private async refresh() {
    await this.loadFiles(this.currentPath);
  }

  private async downloadFile(index: number) {
    const file = this.files[index];
    if (!file) return;

    this.log(`Downloading ${file.name}...`);

    const remotePath =
      this.currentPath === '/' ? `/${file.name}` : `${this.currentPath}/${file.name}`;

    window.location.href = `${this.options.apiEndpoint}/download?path=${encodeURIComponent(
      remotePath
    )}`;
  }

  private async deleteFile(index: number) {
    const file = this.files[index];
    if (!file) return;

    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      this.log(`Deleting ${file.name}...`);

      const remotePath =
        this.currentPath === '/' ? `/${file.name}` : `${this.currentPath}/${file.name}`;

      const response = await fetch(`${this.options.apiEndpoint}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: remotePath, type: file.type }),
      });

      const data = await response.json();

      if (data.success) {
        this.log(`Deleted ${file.name}`);
        await this.refresh();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      this.log(`Error: ${error.message}`, 'error');
    }
  }

  private async renameFile(index: number) {
    const file = this.files[index];
    if (!file) return;

    const newName = prompt('New name:', file.name);
    if (!newName || newName === file.name) return;

    try {
      const oldPath =
        this.currentPath === '/' ? `/${file.name}` : `${this.currentPath}/${file.name}`;
      const newPath =
        this.currentPath === '/' ? `/${newName}` : `${this.currentPath}/${newName}`;

      const response = await fetch(`${this.options.apiEndpoint}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath }),
      });

      const data = await response.json();

      if (data.success) {
        this.log(`Renamed to ${newName}`);
        await this.refresh();
      } else {
        throw new Error(data.error || 'Rename failed');
      }
    } catch (error: any) {
      this.log(`Error: ${error.message}`, 'error');
    }
  }

  private async createFolder() {
    const name = prompt('Folder name:');
    if (!name) return;

    try {
      const remotePath =
        this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;

      const response = await fetch(`${this.options.apiEndpoint}/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: remotePath }),
      });

      const data = await response.json();

      if (data.success) {
        this.log(`Created folder ${name}`);
        await this.refresh();
      } else {
        throw new Error(data.error || 'Create failed');
      }
    } catch (error: any) {
      this.log(`Error: ${error.message}`, 'error');
    }
  }

  private async uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        this.log(`Uploading ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('remotePath', this.currentPath);

        const response = await fetch(`${this.options.apiEndpoint}/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          this.log(`Uploaded ${file.name}`);
          await this.refresh();
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (error: any) {
        this.log(`Error: ${error.message}`, 'error');
      }
    };
    input.click();
  }

  private log(message: string, level: 'info' | 'error' = 'info') {
    const consoleEl = this.container.querySelector('.sftpjs-console-content');
    if (!consoleEl) return;

    const time = new Date().toLocaleTimeString();
    const className = level === 'error' ? 'sftpjs-console-error' : '';
    const line = document.createElement('div');
    line.className = `sftpjs-console-line ${className}`;
    line.textContent = `[${time}] ${message}`;

    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
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

  public destroy() {
    this.container.innerHTML = '';
  }
}