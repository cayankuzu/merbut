import '@testing-library/jest-dom/vitest'

// jsdom reports en-US; the game picks its language from the browser, and the
// unit tests assert the Turkish interface, so pin the browser language first.
Object.defineProperty(window.navigator, 'language', { value: 'tr-TR', configurable: true })
Object.defineProperty(window.navigator, 'languages', { value: ['tr-TR', 'tr'], configurable: true })
