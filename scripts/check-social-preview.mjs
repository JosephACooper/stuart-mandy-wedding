import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const html = await readFile(resolve('index.html'), 'utf8')
const imagePath = '/assets/figma-splash.png'

const requiredMetadata = [
  `property="og:image" content="${imagePath}"`,
  'property="og:image:type" content="image/png"',
  'property="og:image:width" content="1512"',
  'property="og:image:height" content="982"',
  'property="og:image:alt"',
  'name="twitter:card" content="summary_large_image"',
  `name="twitter:image" content="${imagePath}"`,
  'name="twitter:image:alt"',
  `itemprop="image" content="${imagePath}"`,
  `rel="image_src" href="${imagePath}"`,
]

for (const metadata of requiredMetadata) {
  if (!html.includes(metadata)) {
    throw new Error(`Missing social preview metadata: ${metadata}`)
  }
}

await access(resolve('public', imagePath.slice(1)))
console.log('Social preview metadata and image are present.')
