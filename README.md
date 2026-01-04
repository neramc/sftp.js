# sftpcli.js

![library_logo](logo.svg)

Complete SFTP solution with built-in UI library and CLI tool. Work with remote servers or localhost files seamlessly.

## Features

🚀 **Three Products in One**
- **Node.js Library** - Programmatic SFTP operations
- **Web UI Library** - Embeddable file manager (like BlockNote/Xterm.js)
- **CLI Tool** - Full-screen terminal UI (FileZilla-style)

✨ **Localhost Support** - Use `localhost` as host to work with local files  
📁 **Complete File Operations** - Upload, download, delete, rename, chmod  
🎨 **Beautiful Interfaces** - Modern web UI and terminal UI  
🔒 **Secure** - Password and private key authentication  
⚡ **Fast** - Efficient file transfers and operations  
🎯 **TypeScript** - Full type safety

---

## Installation

```bash
npm install sftpcli.js
```

Or use directly via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/sftpcli.js/dist/web/sftpcli.css">
<script src="https://unpkg.com/sftpcli.js/dist/web/index.js"></script>
```

---

## Usage

### 1. As Node.js Library

```javascript
const { SFTPClient } = require('sftpcli.js');

const client = new SFTPClient();

// Connect to remote server
await client.connect({
  host: 'example.com',
  port: 22,
  username: 'user',
  password: 'pass'
});

// Or connect to localhost
await client.connect({
  host: 'localhost',
  username: 'user'
});

// Host with port notation
await client.connect({
  host: 'example.com:2222',  // Port automatically parsed
  username: 'user',
  password: 'pass'
});

// List files
const result = await client.list('/home/user');
console.log(result.data); // Array of FileInfo

// Upload file
await client.put('./local.txt', '/remote/file.txt');

// Download file
await client.get('/remote/file.txt', './local.txt');

// Create directory
await client.mkdir('/remote/newdir');

// Delete file
await client.delete('/remote/file.txt');

// Rename
await client.rename('/old.txt', '/new.txt');

// Read file content
const content = await client.readFile('/remote/file.txt');

// Write file content
await client.writeFile('/remote/file.txt', 'Hello World');

// Get stats
const stats = await client.stat('/remote/file.txt');

// Check existence
const exists = await client.exists('/remote/file.txt');

// Upload directory recursively
await client.putDir('./localdir', '/remotedir');

// Download directory recursively
await client.getDir('/remotedir', './localdir');

// Disconnect
await client.disconnect();
```

### 2. As Web UI Library

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/sftpcli.js/dist/web/sftpcli.css">
</head>
<body>
  <div id="sftp-container" style="height: 600px;"></div>

  <script src="https://unpkg.com/sftpcli.js/dist/web/index.js"></script>
  <script>
    new SFTPCLIWebUI({
      container: '#sftp-container',
      apiEndpoint: 'http://localhost:3000/api',
      theme: 'dark',
      onReady: () => console.log('Ready!'),
      onPathChange: (path) => console.log('Path:', path)
    });
  </script>
</body>
</html>
```

#### React Integration

```tsx
import { useEffect, useRef } from 'react';
import { WebUI } from 'sftpcli.js/dist/web';
import 'sftpcli.js/dist/web/sftpcli.css';

function SFTPComponent() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ui = new WebUI({
      container: containerRef.current,
      apiEndpoint: '/api'
    });

    return () => ui.destroy();
  }, []);

  return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

### 3. As CLI Tool

```bash
# Interactive mode (default)
sftpcli
sftpcli login
sftpcli join

# Direct connection
sftpcli connect -h example.com -u username -w password
sftpcli connect -h example.com:2222 -u user -k ~/.ssh/id_rsa

# Localhost
sftpcli connect -h localhost -u user
```

#### CLI Interface

The CLI provides a FileZilla-style full-screen interface:

```
╔═══════════════════════════════════════════════════════════════════╗
║  SFTPCLI.JS - user@example.com                                    ║
╚═══════════════════════════════════════════════════════════════════╝
┌─ Files ──────────────────────────┬─ Directory Tree ──────────────┐
│ Type  Name           Size  Date  │ 📁 /                          │
│ 📁    Documents      ---   12/01 │   └─ 📁 home                  │
│ 📁    Downloads      ---   12/01 │     └─ 📁 user                │
│ 📄    file.txt       1.2KB 12/01 │       Folders:                │
│ 📄    image.png      450KB 12/01 │       ├─ 📁 Documents         │
│                                   │       ├─ 📁 Downloads         │
└───────────────────────────────────┴───────────────────────────────┘
┌─ Console ───────────────────────────────────────────────────────┐
│ [14:30:22] ✓ Connected to example.com                           │
│ [14:30:23] • Loading files from: /home/user                     │
│ [14:30:23] ✓ Loaded 15 items                                    │
└─────────────────────────────────────────────────────────────────┘
[↑↓] Navigate | [Enter] Open | [d] Download | [Del] Delete | [q] Quit
```

#### CLI Keyboard Shortcuts

- `↑/↓` or `j/k` - Navigate files
- `Enter` - Open folder
- `Backspace` or `h` - Go back
- `d` - Download selected file
- `u` - Upload file
- `Delete` - Delete selected item
- `n` - Create new folder
- `r` - Rename selected item
- `f` - Refresh file list
- `q` or `Ctrl+C` - Quit

---

## Quick Start

### Install globally for CLI
```bash
npm install -g sftpcli.js
sftpcli
```

### Install in project
```bash
npm install sftpcli.js
```

### Use in code
```javascript
const { SFTPClient } = require('sftpcli.js');
const client = new SFTPClient();
await client.connect({ host: 'localhost', username: 'user' });
await client.list('/');
```

---

## Browser Support

**Web UI:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

**CLI:**
- Any terminal supporting ANSI escape codes
- Windows Terminal
- iTerm2, Terminal.app (macOS)
- GNOME Terminal, Konsole (Linux)

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ for developers who love great tools**
