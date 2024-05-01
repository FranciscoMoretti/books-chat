'use client'
import { BookMetadata } from '@/lib/book/books-api'
import Image from 'next/image'
import { CardContent, Card } from '@/components/ui/card'
import { changeZoomValue } from '@/lib/book/volumeToMetadata'
import { cn } from '@/lib/utils'

export function BookCard({
  props: book,
  width,
  height,
  orientation,
  variant
}: {
  props: BookMetadata
  width: number
  height: number
  orientation: 'portrait' | 'square'
  variant: 'small' | 'big'
}) {
  return (
    <Card className="w-full">
      <Image
        src={changeZoomValue(book.image, variant === 'big' ? 3 : 2)}
        alt={book.title + ' book cover'}
        width={width}
        height={height}
        className={cn(
          'm-auto size-auto object-cover',
          orientation === 'portrait'
            ? 'aspect-[3/4] h-full'
            : 'aspect-square h-full'
        )}
        style={{
          objectFit: 'contain'
        }}
      />

      <CardContent className="p-4 space-y-2">
        <h3
          className={cn(
            'font-semibold',
            variant === 'big' ? 'text-xl' : 'text-lg'
          )}
        >
          {book.title}
        </h3>
        <div
          className={cn(
            'flex gap-2',
            variant === 'big' ? 'flex-row items-center' : 'flex-col '
          )}
        >
          <p className={cn('font-medium', variant === 'big' ? 'text-lg' : '')}>
            {book.author}
          </p>
          <p
            className={cn(
              'font-medium text-gray-500 dark:text-gray-400 ',
              variant === 'big' ? 'text-lg' : ''
            )}
          >
            {book.publishedDate}
          </p>
        </div>
        {variant === 'big' && (
          <p
            className="text-gray-500 dark:text-gray-400 prose py-4"
            dangerouslySetInnerHTML={{ __html: book.description }}
          ></p>
        )}
      </CardContent>
    </Card>
  )
}
