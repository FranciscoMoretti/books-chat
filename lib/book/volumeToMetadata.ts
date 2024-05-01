import { BookMetadata, VolumeInfo } from './books-api'

export function volumeToMetadata(item: {
  id: string
  volumeInfo: VolumeInfo
}): BookMetadata | null {
  if (!item.volumeInfo.imageLinks) {
    return null
  }
  return {
    id: item.id,
    title: item.volumeInfo.title,
    author: item.volumeInfo.authors.join(', '),
    description: item.volumeInfo.description,
    publishedDate: item.volumeInfo.publishedDate,
    image: changeZoomValue(item.volumeInfo.imageLinks.thumbnail, 2).replace(
      'http://',
      'https://'
    )
  }
}
export function changeZoomValue(originalUrl: string, newZoomValue: number) {
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
