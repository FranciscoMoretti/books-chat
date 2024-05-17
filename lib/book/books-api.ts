'use server'

import { Metadata } from 'next'
import { volumeToMetadata } from './volumeToMetadata'

const apiVolumesURL = 'https://www.googleapis.com/books/v1/volumes'
const apiVolumeIdURL = 'https://www.googleapis.com/books/v1/volumes/'

export type BookMetadata = {
  id: string
  title: string
  author: string
  description: string
  publishedDate: string
  averageRating: number
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
  averageRating: number
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

export async function fetchMultipleBooksByTitleAuthor({
  books
}: {
  books: { title: string; author: string }[]
}): Promise<BookMetadata[]> {
  const promises = books.map(
    async titleAuthor =>
      await fetchVolumesByQuery({
        query: `${titleAuthor.title} by ${titleAuthor.author}`,
        maxResults: 1
      })
  )
  return (
    (await Promise.all(promises)).filter(Boolean) as BookMetadata[][]
  ).map(arr => arr[0])
}

export async function fetchVolumeByID(
  bookID: string
): Promise<BookMetadata | null> {
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
    .then(res => volumeToMetadata(res))
    .catch(error => {
      console.error('Error:', error)
      return null
    })
}

export async function fetchVolumesByQuery({
  query,
  maxResults = 3
}: {
  query: string
  maxResults?: number
}): Promise<BookMetadata[] | null> {
  const url = `${apiVolumesURL}?q=${query}&maxResults=${maxResults}&orderBy=relevance&printType=books&langRestrict=en&key=${process.env.GOOGLE_BOOKS_API_KEY}`

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
