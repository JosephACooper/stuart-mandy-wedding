import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

const results = {}
const fast = process.env.QA_FAST === '1'

async function openSite(viewport, name) {
  const context = await browser.newContext({ viewport, reducedMotion: fast ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' })
  if (!fast) {
    await page.waitForTimeout(2600)
    await page.screenshot({ path: `recordings/qa-${name}-intro.png` })
    await page.waitForTimeout(2600)
  }
  return { context, page, consoleErrors }
}

{
  const { context, page, consoleErrors } = await openSite({ width: 1440, height: 1000 }, 'desktop')
  await page.screenshot({ path: 'recordings/qa-desktop-full.png', fullPage: true })

  const content = await page.locator('body').innerText()
  const backgroundRepeat = await page.locator('.paper-surface').evaluate((element) => getComputedStyle(element).backgroundRepeat)
  const provisionalTagCount = await page.locator('.itinerary-status').count()
  await page.getByRole('button', { name: 'RSVP', exact: true }).first().click()
  await page.getByLabel('Your name').fill('Codex QA Test')
  await page.getByText('Joyfully attending', { exact: true }).click()
  const conditionalFields = {
    partySize: await page.getByLabel('Number in your party').isVisible(),
    guestNames: await page.getByLabel('Names of guests joining you').isVisible(),
    dietary: await page.getByLabel(/Dietary requirements/).isVisible(),
    song: await page.getByLabel(/Song request/).isVisible(),
    message: await page.getByLabel(/A message for Stuart/).isVisible(),
  }
  await page.getByLabel('Number in your party').fill('2')
  await page.getByLabel('Names of guests joining you').fill('Codex QA Guest')
  await page.getByLabel(/Dietary requirements/).fill('QA only')
  await page.getByLabel(/Song request/).fill('QA Song')
  await page.getByLabel(/A message for Stuart/).fill('Automated local QA — do not submit')
  await page.screenshot({ path: 'recordings/qa-desktop-rsvp.png' })
  const modalChrome = await page.locator('.rsvp-modal').evaluate((element) => {
    const styles = getComputedStyle(element)
    const before = getComputedStyle(element, '::before')
    return { borderWidth: styles.borderWidth, beforeContent: before.content }
  })
  await page.getByRole('button', { name: /Send RSVP/ }).click()
  const localSubmissionMessage = await page.locator('.rsvp-form__error').innerText()

  results.desktop = {
    contentChecks: {
      ceremony: content.includes('Parking immediately outside the church is very limited'),
      reception: content.includes('The farm is reached from the A39 via Skimmerton Lane'),
      noProvisionalTag: provisionalTagCount === 0,
      updatedArrival: content.includes('2:30pm') && !content.includes('2:00pm'),
      receptionCanapes: content.includes('canapés and drinks on arrival at Greenway Farm'),
      receptionMusic: content.includes('music from soloist Sofia Aira'),
      hotBuffetAndDancing: content.includes('5:00pm') && content.includes('Hot buffet, fun and dancing') && !content.includes('Dinner, speeches and dancing'),
      djTiming: content.includes('playing from 7:30pm') && content.includes('Way Back Wayne'),
      finishTime: content.includes('11:30pm') && content.includes('Evening finishes'),
      taxiGuidance: content.includes('Stogursey Pulse'),
      designCredit: content.includes('made with ♥ by Joseph and Maddie'),
      photographs: content.includes('We won’t have an official photographer'),
      noGifts: content.includes('Please don’t bring gifts'),
    },
    backgroundRepeat,
    modalChrome,
    conditionalFields,
    localSubmissionMessage,
    consoleErrors,
  }
  await context.close()
}

{
  const { context, page, consoleErrors } = await openSite({ width: 390, height: 844 }, 'mobile')
  await page.screenshot({ path: 'recordings/qa-mobile-hero.png' })
  await page.locator('#wedding .itinerary').scrollIntoViewIfNeeded()
  const timelineTypography = await page.locator('#wedding .itinerary-row').first().evaluate((row) => ({
    time: getComputedStyle(row.querySelector('.time')).fontSize,
    event: getComputedStyle(row.querySelector('h3')).fontSize,
  }))
  await page.screenshot({ path: 'recordings/qa-mobile-timeline.png' })
  await page.locator('#stay').scrollIntoViewIfNeeded()
  const mobileLayout = await page.evaluate(() => {
    const card = document.querySelector('.stay-card')
    const link = card?.querySelector('.stay-link')
    const rail = document.querySelector('.stay-grid')
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cardHeight: card?.getBoundingClientRect().height,
      linkGap: card && link ? link.getBoundingClientRect().top - card.querySelector('p').getBoundingClientRect().bottom : null,
      railOverflow: rail ? getComputedStyle(rail).overflowX : null,
      scrollbarWidth: rail ? getComputedStyle(rail).scrollbarWidth : null,
      arrow: link?.querySelector('span')?.textContent,
    }
  })
  await page.screenshot({ path: 'recordings/qa-mobile-stay.png' })
  await page.locator('.note-section').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'recordings/qa-mobile-note.png' })
  await page.locator('.mobile-footer-cta').scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  const footer = await page.locator('.mobile-footer-cta').evaluate((element) => ({
    display: getComputedStyle(element).display,
    stage: element.className,
    buttonOpacity: getComputedStyle(element.querySelector('button')).opacity,
  }))
  await page.screenshot({ path: 'recordings/qa-mobile-footer.png' })
  await page.locator('#rsvp').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Reply to our invitation' }).first().click()
  await page.getByLabel('Your name').fill('Mobile QA')
  await page.getByText('Joyfully attending', { exact: true }).click()
  await page.screenshot({ path: 'recordings/qa-mobile-rsvp.png' })
  const modalBorderWidth = await page.locator('.rsvp-modal').evaluate((element) => getComputedStyle(element).borderWidth)
  results.mobile = { heroHeight: await page.locator('.hero').evaluate((element) => element.getBoundingClientRect().height), timelineTypography, mobileLayout, footer, modalBorderWidth, songVisible: await page.getByLabel(/Song request/).isVisible(), consoleErrors }
  await context.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
