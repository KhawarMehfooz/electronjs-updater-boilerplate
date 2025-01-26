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

    setupAutoUpdater();

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

function setupAutoUpdater() {
    autoUpdater.on('checking-for-update', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Checking for Updates',
            message: 'Checking for updates...',
        });
    });

    autoUpdater.on('update-available', (info) => {
        dialog
            .showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `Version ${info.version} is available. Release notes:\n\n${info.releaseNotes || 'No release notes available.'}\n\nWould you like to download it?`,
                buttons: ['Yes', 'No'],
            })
            .then((result) => {
                if (result.response === 0) {
                    autoUpdater.downloadUpdate();
                }
            });
    });

    autoUpdater.on('update-not-available', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version of the app.',
        });
    });

    autoUpdater.on('download-progress', (progress) => {
        mainWindow.setProgressBar(progress.percent / 100);

        const message = `Download speed: ${Math.round(progress.bytesPerSecond / 1024)} KB/s\n` +
            `Downloaded: ${Math.round(progress.percent)}%\n` +
            `Remaining time: ${Math.round(progress.timeRemaining)} seconds`;

        mainWindow.webContents.send('download-progress', message);
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow.setProgressBar(-1); // Clear progress bar
        dialog
            .showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'An update is ready to install. Would you like to restart the app now?',
                buttons: ['Restart', 'Later'],
            })
            .then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
    });

    autoUpdater.on('error', (error) => {
        dialog.showErrorBox('Update Error', error == null ? 'Unknown error' : (error.stack || error).toString());
    });
}
