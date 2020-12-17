// Renderer file that adds ipcRenderer to the window context for the vue app
import { ipcRenderer } from 'electron';
window.ipcRenderer = ipcRenderer;