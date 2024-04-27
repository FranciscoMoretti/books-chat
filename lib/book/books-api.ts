'use server'

const apiUrl = 'https://www.googleapis.com/books/v1/volumes'

export type BookMetadata = {
  title: string
  author: string
  description: string
  publishedDate: string
  image: string
}

export type BookMetadataReduced = {
  title: string
  author: string
  publishedDate: string
  image: string
}

type VolumeInfo = {
  title: string
  authors: string[]
  description: string
  publishedDate: string
  previewLink: string
  imageLinks?: {
    thumbnail: string
  }
}

type GoogleBooksResponse = {
  items?: { volumeInfo: VolumeInfo }[]
}

export async function fetchSearchMultiBookMetadata(
  titleAuthors: { title: string; author: string }[]
): Promise<(BookMetadata | null)[]> {
  const promises = titleAuthors.map(
    async titleAuthor =>
      await fetchSearchBookMetadata(titleAuthor.title, titleAuthor.author)
  )
  return await Promise.all(promises)
}

export async function fetchSearchBookMetadata(
  title: string,
  author: string
): Promise<BookMetadata | null> {
  const query = `${title} by ${author}`
  const url = `${apiUrl}?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY}`

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json() as Promise<GoogleBooksResponse>
    })
    .then(data => {
      const items = data.items ?? []

      if (items.length > 0 && items[0]) {
        for (const item of items) {
          const metadata = volumeInfoToMetadata(item.volumeInfo)
          if (metadata) {
            return metadata
          }
        }
        console.error(
          `No book api item had all the metadata for: ${title} author: ${author}`
        )
        return null
      } else {
        console.error(`Book not found: ${title} author: ${author}`)
        return null
      }
    })
    .catch(error => {
      console.error('Error:', error)
      return null
    })
}

function volumeInfoToMetadata(firstBook: VolumeInfo): {
  title: string
  author: string
  description: string
  publishedDate: string
  image: string
} | null {
  if (!firstBook.imageLinks) {
    return null
  }
  return {
    title: firstBook.title,
    author: firstBook.authors.join(', '),
    description: firstBook.description,
    publishedDate: firstBook.publishedDate,
    image: changeZoomValue(firstBook.imageLinks.thumbnail, 2)
  }
}

function changeZoomValue(originalUrl: string, newZoomValue: number) {
  // Check if the URL contains the 'zoom' parameter
  if (originalUrl.includes('zoom=')) {
    // Replace the existing 'zoom' parameter with the new zoom value
    return originalUrl.replace(/zoom=\d+/, `zoom=${newZoomValue}`)
  } else {
    // If 'zoom' parameter doesn't exist, add it to the URL
    const separator = originalUrl.includes('?') ? '&' : '?'
    return `${originalUrl}${separator}zoom=${newZoomValue}`
  }
}
