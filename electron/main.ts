import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // 获取主显示器的工作区尺寸，确保窗口在可见区域内
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;
  const winW = Math.min(1400, screenW - 40);
  const winH = Math.min(900, screenH - 40);
  const winX = Math.max(0, Math.floor((screenW - winW) / 2));
  const winY = Math.max(0, Math.floor((screenH - winH) / 2));

  mainWindow = new BrowserWindow({
    x: winX,
    y: winY,
    width: winW,
    height: winH,
    minWidth: 1024,
    minHeight: 680,
    title: 'AI 康奈尔笔记',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const { registerFileIpc } = await import('./ipc/file.ipc');
  const { registerParseIpc } = await import('./ipc/parse.ipc');

  registerFileIpc();
  registerParseIpc();

  ipcMain.handle('export:pdf', async (_event, data) => {
    const { exportToPDF } = await import('./services/export.service');
    await exportToPDF(data);
  });
  ipcMain.handle('export:word', async (_event, data) => {
    const { exportToWord } = await import('./services/export.service');
    await exportToWord(data);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
