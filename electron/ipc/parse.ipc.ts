import { ipcMain, BrowserWindow } from 'electron';

export function registerParseIpc() {
  ipcMain.handle('parse:file', async (event, filePath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      // 动态导入，避免顶层加载 jsdom
      const { parseFileContent } = await import('../services/parser/index');
      const result = await parseFileContent(filePath, (progress: number, message: string) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('parse:progress', progress, message);
        }
      });
      return result;
    } catch (error: any) {
      throw new Error(`解析失败: ${error.message}`);
    }
  });

  ipcMain.handle('parse:url', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      const { parseFileContent } = await import('../services/parser/index');
      const result = await parseFileContent(url, (progress: number, message: string) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('parse:progress', progress, message);
        }
      });
      return result;
    } catch (error: any) {
      throw new Error(`解析失败: ${error.message}`);
    }
  });
}
