# SFTP File Manager

![library_logo](logo.svg)

A simple and powerful Node.js library for managing file systems on SFTP servers.

## Installation

```bash
npm install sftp.js
```

## Basic Usage

### 1. Connect and Basic Operations

```javascript
const SFTPManager = require('sftp-file-manager');

const sftp = new SFTPManager();

// Connect with password
await sftp.connect({
  host: '192.168.1.100',
  port: 22,
  username: 'ubuntu',
  password: 'your_password'
});

// Or connect with private key
await sftp.connect({
  host: '192.168.1.100',
  port: 22,
  username: 'ubuntu',
  privateKey: '/path/to/private_key.pem'
});
```

### 2. Upload Files

```javascript
// Upload single file
const result = await sftp.uploadFile(
  './local/file.txt',
  '/remote/path/file.txt'
);
console.log(result.message); // "File uploaded successfully"

// Upload entire directory (recursive)
await sftp.uploadDirectory(
  './local/folder',
  '/remote/folder'
);
```

### 3. Download Files

```javascript
// Download single file
await sftp.downloadFile(
  '/remote/path/file.txt',
  './local/file.txt'
);

// Download entire directory (recursive)
await sftp.downloadDirectory(
  '/remote/folder',
  './local/folder'
);
```

### 4. File and Directory Management

```javascript
// List files
const list = await sftp.listFiles('/remote/path');
console.log(list.files);

// Check if file exists
const exists = await sftp.exists('/remote/path/file.txt');
console.log(exists.exists); // true or false

// Create directory
await sftp.createDirectory('/remote/new_folder');

// Delete file
await sftp.deleteFile('/remote/path/file.txt');

// Delete directory (recursive)
await sftp.deleteDirectory('/remote/folder');

// Rename or move file
await sftp.rename(
  '/remote/old_name.txt',
  '/remote/new_name.txt'
);

// Change file permissions
await sftp.chmod('/remote/file.txt', 0o755);
```

### 5. Read and Write File Content

```javascript
// Read file content
const result = await sftp.readFile('/remote/file.txt');
console.log(result.content);

// Write file content
await sftp.writeFile(
  '/remote/file.txt',
  'Hello, World!'
);
```

### 6. Disconnect

```javascript
await sftp.disconnect();
```

## Express.js Backend Example

```javascript
const express = require('express');
const SFTPManager = require('sftp-file-manager');

const app = express();
app.use(express.json());

// Create SFTP instance
const sftp = new SFTPManager();

// File upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    // Connect to SFTP
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: 22,
      username: process.env.SFTP_USERNAME,
      privateKey: process.env.SFTP_KEY_PATH
    });

    // Upload file
    const result = await sftp.uploadFile(
      req.body.localPath,
      req.body.remotePath
    );

    // Disconnect
    await sftp.disconnect();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List files endpoint
app.get('/api/files', async (req, res) => {
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: 22,
      username: process.env.SFTP_USERNAME,
      privateKey: process.env.SFTP_KEY_PATH
    });

    const list = await sftp.listFiles(req.query.path || '/');
    await sftp.disconnect();

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Reference

### `connect(config)`
Connect to SFTP server.

**Parameters:**
- `config.host` (string): Server hostname
- `config.port` (number): Port number (default: 22)
- `config.username` (string): Username
- `config.password` (string): Password (optional)
- `config.privateKey` (string): Private key path (optional)
- `config.retries` (number): Number of retry attempts (default: 3)

### `disconnect()`
Close SFTP connection.

### `uploadFile(localPath, remotePath)`
Upload a local file to remote server.

### `downloadFile(remotePath, localPath)`
Download a remote file to local system.

### `uploadDirectory(localDir, remoteDir)`
Upload entire local directory to remote server (recursive).

### `downloadDirectory(remoteDir, localDir)`
Download entire remote directory to local system (recursive).

### `deleteFile(remotePath)`
Delete a remote file.

### `deleteDirectory(remotePath)`
Delete a remote directory (recursive).

### `createDirectory(remotePath, recursive)`
Create a remote directory.

### `listFiles(remotePath)`
List files and directories at remote path.

### `exists(remotePath)`
Check if file or directory exists.

### `rename(oldPath, newPath)`
Rename or move a file.

### `chmod(remotePath, mode)`
Change file permissions.

### `readFile(remotePath, encoding)`
Read remote file content.

### `writeFile(remotePath, content, encoding)`
Write content to remote file.

### `isConnected()`
Get current connection status.

## License

MIT

## Contributing

Issues and pull requests are always welcome!