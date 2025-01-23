const { app, BrowserWindow, Menu, dialog } = require('electron/main');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();

    // Set up the app menu with "Check for Updates" functionality
    const menu = Menu.buildFromTemplate([
        {
            label: 'App',
            submenu: [
                {
                    label: 'Check for Updates',
                    click: () => {
                        checkForUpdates();
                    },
                },
                { role: 'quit' },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Auto-updater setup
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: 'A new update is available. It will be downloaded in the background.',
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog
            .showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'An update is ready to install. Would you like to restart the app now?',
                buttons: ['Restart', 'Later'],
            })
            .then((result) => {
                if (result.response === 0) autoUpdater.quitAndInstall();
            });
    });

    autoUpdater.on('error', (error) => {
        dialog.showErrorBox('Update Error', error == null ? 'Unknown error' : (error.stack || error).toString());
    });

    // Check for updates automatically on startup
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Function to manually trigger update checks
function checkForUpdates() {
    autoUpdater.checkForUpdates();
}
