const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { parse } = require('url');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let splashWindow;
let serverProcess = null;
const PORT = 3001;

// --- Config helpers ---

function getConfigDir() {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'standalone')
        : path.join(__dirname, '..');
}

function getConfigPath() {
    return path.join(getConfigDir(), 'db-config.json');
}

function buildDatabaseUrl(config) {
    const pass = config.password ? `:${config.password}` : '';
    return `mysql://${config.username}${pass}@${config.server}:${config.port}/${config.database}`;
}

function loadDatabaseUrl() {
    try {
        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) return null;
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!config.server) return null;
        return buildDatabaseUrl(config);
    } catch {
        return null;
    }
}

// --- Windows ---

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 480,
        height: 300,
        frame: false,
        transparent: false,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: { nodeIntegration: false },
    });
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.center();
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Liberty Kollection POS',
        icon: path.join(__dirname, '../public/logo1.png'),
    });

    mainWindow.maximize();
    mainWindow.loadURL(`http://localhost:${PORT}`);

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.destroy();
            splashWindow = null;
        }
        mainWindow.show();
    });

    mainWindow.on('closed', () => { mainWindow = null; });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url || url === 'about:blank') return { action: 'allow' };
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// --- Server ---

function waitForServer(url, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            http.get(url, () => resolve()).on('error', () => {
                if (Date.now() - start > timeout) {
                    reject(new Error('Server failed to start within 60 seconds.'));
                } else {
                    setTimeout(check, 500);
                }
            });
        };
        check();
    });
}

async function startNextServer() {
    const appDir = app.isPackaged
        ? path.join(process.resourcesPath, 'app')
        : path.join(__dirname, '..');

    const standaloneDir = app.isPackaged
        ? path.join(process.resourcesPath, 'standalone')
        : path.join(appDir, '.next', 'standalone');

    const configDir = getConfigDir();
    const databaseUrl = loadDatabaseUrl() || '';

    const serverEnv = {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
        CONFIG_DIR: configDir,
        DATABASE_URL: databaseUrl,
    };

    const serverPath = path.join(standaloneDir, 'server.js');

    if (fs.existsSync(serverPath)) {
        return new Promise((resolve, reject) => {
            serverProcess = fork(serverPath, [], {
                env: {
                    ...serverEnv,
                    PRISMA_QUERY_ENGINE_LIBRARY: path.join(
                        standaloneDir,
                        'node_modules', '@prisma', 'engines',
                        'query_engine-windows.dll.node'
                    ),
                },
                cwd: standaloneDir,
                silent: false,
            });
            serverProcess.on('error', reject);
            serverProcess.on('exit', (code) => {
                if (code !== 0 && code !== null) reject(new Error(`Server exited with code ${code}`));
            });
            setTimeout(resolve, 500);
        });
    }

    // Dev fallback
    const nextApp = require('next')({
        dev: false,
        dir: appDir,
        conf: { distDir: '.next' },
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();
    return new Promise((resolve, reject) => {
        http.createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(PORT, '127.0.0.1', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// --- App lifecycle ---

app.on('ready', async () => {
    createSplashWindow();
    try {
        await startNextServer();
        await waitForServer(`http://localhost:${PORT}`);
        createMainWindow();
    } catch (err) {
        if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
        dialog.showErrorBox(
            'Startup Error',
            `Liberty POS failed to start.\n\nError: ${err.message}`
        );
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createMainWindow();
});
