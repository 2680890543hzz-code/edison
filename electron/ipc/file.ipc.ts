import { ipcMain, BrowserWindow } from 'electron';

export function registerFileIpc() {
  ipcMain.handle('file:openDialog', async (_event, options) => {
    const { dialog, BrowserWindow } = await import('electron');
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return [];
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: options.filters,
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('file:saveDialog', async (_event, options) => {
    const { dialog, BrowserWindow } = await import('electron');
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath;
  });
}
