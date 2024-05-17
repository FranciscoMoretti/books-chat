export function imageUrlZoomToFixedSize(
  url: string,
  width: number,
  height: number
): string {
  // Changes the image URL to use fixed size instead of zoom level
  // E.g.
  // https://books.google.com/books/publisher/content/images/frontcover/QQ6vDwAAQBAJ?zoom=1
  // to
  // https://books.google.com/books/publisher/content/images/frontcover/QQ6vDwAAQBAJ?fife=w400-h600
  const regex = /zoom=(\d+)/
  const match = url.match(regex)
  if (match) {
    const zoom = match[1]
    const newURL = url.replace(regex, `fife=w${width}-h${height}`)
    return newURL
  }
  return url
}

export function bookPublisherImageUrl(
  bookId: string,
  width: number,
  height: number
): string {
  return `https://books.google.com/books/publisher/content/images/frontcover/${bookId}?fife=w${width}-h${height}&source=gbs_api`
}
