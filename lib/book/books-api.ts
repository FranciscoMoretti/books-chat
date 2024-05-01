'use server'

import { volumeToMetadata } from './volumeToMetadata'

const apiVolumesURL = 'https://www.googleapis.com/books/v1/volumes'
const apiVolumeIdURL = 'https://www.googleapis.com/books/v1/volumes/'

export type BookMetadata = {
  id: string
  title: string
  author: string
  description: string
  publishedDate: string
  image: string
}

export type BookMetadataReduced = {
  id: string
  title: string
  author: string
  publishedDate: string
  image: string
}

export type VolumeInfo = {
  title: string
  authors: string[]
  description: string
  publishedDate: string
  previewLink: string
  imageLinks?: {
    thumbnail: string
  }
}

type GoogleBooksVolume = {
  volumeInfo: VolumeInfo
  id: string
}

type GoogleBooksVolumeListResponse = {
  items?: GoogleBooksVolume[]
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
  const url = `${apiVolumesURL}?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY}`

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json() as Promise<GoogleBooksVolumeListResponse>
    })
    .then(data => {
      const items = data.items ?? []

      if (items.length > 0 && items[0]) {
        for (const item of items) {
          const metadata = volumeToMetadata(item)
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

export async function fetchVolumeByID(
  bookID: string
): Promise<GoogleBooksVolume | null> {
  const url = `${apiVolumeIdURL}${bookID}?key=${process.env.GOOGLE_BOOKS_API_KEY}`

  console.log(url)
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        console.error(response)
        throw new Error('Network response was not ok')
      }
      return response.json() as Promise<GoogleBooksVolume>
    })
    .catch(error => {
      console.error('Error:', error)
      return null
    })
}

export async function fetchBooksWithQuery(
  query: string,
  maxResults: number = 3
): Promise<BookMetadata[] | null> {
  const url = `${apiVolumesURL}?q=${query}&maxResults=${maxResults}&key=${process.env.GOOGLE_BOOKS_API_KEY}`

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json() as Promise<GoogleBooksVolumeListResponse>
    })
    .then(data => {
      const items = data.items ?? []

      if (items.length > 0 && items[0]) {
        return items
          .map(item => volumeToMetadata(item))
          .filter(Boolean) as BookMetadata[]
      } else {
        console.error(`Book not found for query: ${query}`)
        return null
      }
    })
    .catch(error => {
      console.error('Error:', error)
      return null
    })
}
