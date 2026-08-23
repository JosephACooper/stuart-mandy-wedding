import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir: 'recordings/raw', size: { width: 390, height: 844 } },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const video = page.video()
const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(error.message))

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
if (!(await page.locator('body').innerText()).trim()) throw new Error('The page rendered blank')
if (await page.locator('.vite-error-overlay, #webpack-dev-server-client-overlay').count()) throw new Error('A Vite error overlay is visible')
await page.locator('#rsvp').scrollIntoViewIfNeeded()
await page.getByRole('button', { name: 'Reply to our invitation' }).first().click()
await page.getByLabel('Your name').fill('Mobile test')
await page.getByText('Joyfully attending', { exact: true }).click()

await page.evaluate(() => {
  const caption = document.createElement('div')
  caption.id = 'recording-caption'
  Object.assign(caption.style, {
    position: 'fixed',
    zIndex: '10000',
    top: '12px',
    left: '16px',
    right: '16px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(46, 36, 32, 0.92)',
    color: 'white',
    font: '600 14px/1.35 system-ui, sans-serif',
    textAlign: 'center',
    boxShadow: '0 3px 14px rgba(0, 0, 0, 0.25)',
  })
  caption.textContent = 'Numeric field starts at 1'
  document.body.append(caption)
})

const partySize = page.getByLabel('Number in your party')
await partySize.scrollIntoViewIfNeeded()
await partySize.focus()
await page.waitForTimeout(1400)
await partySize.press('Meta+A')
await page.waitForTimeout(600)
await partySize.press('Backspace')
await page.evaluate(() => {
  document.querySelector('#recording-caption').textContent = 'Cleared: the field stays empty (no forced 0)'
})
await page.waitForTimeout(2000)
await partySize.pressSequentially('3', { delay: 250 })
await page.evaluate(() => {
  document.querySelector('#recording-caption').textContent = 'Entered 3 successfully'
})
await page.waitForTimeout(1800)

if (await partySize.inputValue() !== '3') {
  throw new Error('Party-size input did not retain the replacement value')
}
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join('\n')}`)

await context.close()
await video.saveAs('recordings/party-size-numeric-field-fix.webm')
await browser.close()
