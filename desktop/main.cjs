// Merbut for desktop: the same web build, in its own window, fully offline.
//
// The game is served from a private app:// origin instead of file://. Chromium
// refuses fetch() on file URLs (the game streams its 3D models with fetch) and
// gives file pages no stable origin for saves; a standard, secure custom scheme
// behaves like a real website, so localStorage saves persist in the user's
// profile between launches.
const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const SCHEME = 'app'
const HOST = 'merbut'
const DIST = path.join(__dirname, '..', 'dist')

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
])

// Laptops with two GPUs: render the game on the faster one.
app.commandLine.appendSwitch('force_high_performance_gpu')

function serveGame() {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url)
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
    const file = path.normalize(path.join(DIST, relative))
    if (file !== DIST && !file.startsWith(DIST + path.sep)) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
}

const isGameUrl = (url) => url.startsWith(`${SCHEME}://${HOST}/`)

function openOutside(url) {
  if (/^https?:\/\//.test(url)) shell.openExternal(url)
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: 'Merbut',
    backgroundColor: '#12050a',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // Music may start with the title screen, as it would in any installed game.
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  window.once('ready-to-show', () => {
    window.maximize()
    window.show()
  })

  // Links (credits, itch.io) open in the player's browser, never inside the game window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (isGameUrl(url)) return
    event.preventDefault()
    openOutside(url)
  })

  // F11 toggles fullscreen like most PC games; the in-game button uses the same window.
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      window.setFullScreen(!window.isFullScreen())
      event.preventDefault()
    }
  })

  window.loadURL(`${SCHEME}://${HOST}/index.html`)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  Menu.setApplicationMenu(null)
  app.whenReady().then(() => {
    serveGame()
    createWindow()
  })
  app.on('window-all-closed', () => app.quit())
}
