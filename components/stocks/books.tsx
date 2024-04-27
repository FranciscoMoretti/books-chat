'use client'

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'
import { BookMetadata, BookMetadataReduced } from '@/lib/book/books-api'

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ncWsA58mcHs
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { CardContent, Card } from '@/components/ui/card'
import { changeZoomValue } from '@/lib/book/volumeToMetadata'

export function BookDetails({ props: book }: { props: BookMetadata }) {
  return (
    <Card className="w-full">
      <img
        alt="Book Cover"
        className="aspect-[2/3] object-cover rounded-t-lg"
        height={1200}
        src={changeZoomValue(book.image, 4)}
        width={700}
      />
      <CardContent className="p-4 space-y-2">
        <h3 className="text-xl font-semibold">{book.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {book.author}
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Published: {book.publishedDate}
        </p>
        <p
          className="text-gray-500 dark:text-gray-400"
          dangerouslySetInnerHTML={{ __html: book.description }}
        ></p>
      </CardContent>
    </Card>
  )
}

export default function Book({ props: book }: { props: BookMetadataReduced }) {
  return (
    <Card className="w-full max-w-sm">
      <img
        alt="Book Cover"
        className="aspect-[2/3] object-cover rounded-t-lg"
        height={600}
        src={book.image}
        width={400}
      />
      <CardContent className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{book.title}</h3>
        <p className="text-gray-500 dark:text-gray-400">{book.author}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Published: {book.publishedDate}
        </p>
      </CardContent>
    </Card>
  )
}

export function Books({ props: books }: { props: BookMetadataReduced[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm sm:flex-row">
        {books.map(book => (
          <button
            key={book.id}
            className="flex cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-700 sm:w-52"
            onClick={async () => {
              const response = await submitUserMessage(
                `View book of id=${book.id}`
              )
              setMessages(currentMessages => [...currentMessages, response])
            }}
          >
            <Book props={book} />
          </button>
        ))}
      </div>
      <div className="p-4 text-center text-sm text-zinc-500">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </div>
    </div>
  )
}
