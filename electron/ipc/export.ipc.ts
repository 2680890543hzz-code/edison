import { ipcMain } from 'electron';
import { exportToPDF, exportToWord } from '../services/export.service';

export function registerExportIpc() {
  ipcMain.handle('export:pdf', async (_event, data) => {
    await exportToPDF(data);
  });

  ipcMain.handle('export:word', async (_event, data) => {
    await exportToWord(data);
  });
}
