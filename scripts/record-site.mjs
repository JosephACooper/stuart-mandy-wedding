import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

async function record(name, viewport, afterReveal) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: 'recordings/raw', size: viewport },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const video = page.video()

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5400)
  if (afterReveal) await afterReveal(page)
  await context.close()
  await video.saveAs(`recordings/${name}.webm`)
}

await record('desktop-continuous-unfold', { width: 1440, height: 900 })
await record('mobile-continuous-unfold', { width: 390, height: 844 }, async (page) => {
  await page.locator('#wedding').evaluate((element) => element.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  await page.waitForTimeout(1800)
})

await browser.close()
