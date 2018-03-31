/* eslint-disable no-await-in-loop */
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

const documents = require('./documents.json')

const OUTPUT_DIR = path.resolve(__dirname, 'output')

const buildConfigUrl = id => `https://e.issuu.com/config/${id}.json`
const buildMetaUrl = ({ documentURI, ownerUsername }) =>
  `https://api.issuu.com/call/reader/api/dynamic/${ownerUsername}/${documentURI}`
const buildDocumentUrl = ({ documentURI, ownerUsername }) =>
  `https://reader3.isu.pub/${ownerUsername}/${documentURI}/reader3_4.json`
const buildImgUrl = ({ imageUri }) => `http://${imageUri}`

const fetchJson = url => fetch(url).then(res => res.json())
const fetchBody = url => fetch(url).then(res => res.body)
const buildFileName = ({ index, fileTitle }) => {
  const fileNumber = String(index + 1).padStart(3, '0')
  return `${fileTitle} - Page ${fileNumber}.jpg`
}
const writeStream = (fileName, body) => new Promise((resolve) => {
  body.pipe(fs.createWriteStream(fileName)).on('finish', resolve)
})

const downloadDocument = async (id) => {
  const config = await fetchJson(buildConfigUrl(id))
  const { document: { pages } } = await fetchJson(buildDocumentUrl(config))
  const { metadata: { title } } = await fetchJson(buildMetaUrl(config))

  const fileTitle = title.replace('.', '')
  const outputDir = path.join(OUTPUT_DIR, fileTitle)

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR)
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  console.log(`Starting download of ${title}`)

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    console.log(`Downloading ${index + 1} of ${pages.length}`)
    const body = await fetchBody(buildImgUrl(page))
    const fileName = path.join(outputDir, buildFileName({ index, fileTitle }))
    await writeStream(fileName, body)
  }

  console.log(`${title} downloaded`)
}

const download = async () => {
  for (let index = 0; index < documents.length; index += 1) {
    const documentId = documents[index]
    await downloadDocument(documentId)
  }
}

download().catch(console.error)
