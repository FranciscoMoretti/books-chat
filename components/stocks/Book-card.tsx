'use client'
import { BookMetadata } from '@/lib/book/books-api'
import {
  bookPublisherImageUrl,
  imageUrlZoomToFixedSize
} from '@/lib/book/books-api-utils'
import Image from 'next/image'
import { CardContent, Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BookDescription } from './book-description'
import { RatingCount } from './rating-count'

export function BookCard({
  props: book,
  width,
  height,
  orientation,
  variant,
  className
}: {
  props: BookMetadata
  width: number
  height: number
  orientation: 'portrait' | 'square'
  variant: 'small' | 'big'
  className?: string
}) {
  const imageUrl = bookPublisherImageUrl(book.id, width, height)
  return (
    <Card className={cn('w-full', className)}>
      <Image
        src={imageUrl}
        alt={book.title + ' book cover'}
        width={width}
        height={height}
        className={cn(
          'm-auto object-cover',
          orientation === 'portrait' ? 'aspect-[3/4] ' : 'aspect-square'
        )}
        style={{
          objectFit: 'contain',
          height: height
        }}
      />

      <CardContent className="p-4 space-y-2 text-left">
        <h3
          className={cn(
            'font-semibold',
            variant === 'big' ? 'text-2xl' : 'text-xl'
          )}
        >
          {book.title}
        </h3>
        <RatingCount rating={book.averageRating ?? '-'} />
        <div
          className={cn(
            'flex gap-2',
            variant === 'big' ? 'flex-row items-center' : 'flex-col '
          )}
        >
          <p
            className={cn(
              'font-semibold text-muted-foreground ',
              variant === 'big' ? 'text-lg' : ''
            )}
          >
            {book.author}
          </p>
          <p
            className={cn(
              'font-medium text-muted-foreground ',
              variant === 'big' ? 'text-lg' : ''
            )}
          >
            {book.publishedDate}
          </p>
        </div>
        {/* // TODO: Text is long, Make it collapsable. Collapsed by default */}
        {variant === 'big' && (
          <BookDescription descriptionHtml={book.description} />
        )}
      </CardContent>
    </Card>
  )
}
