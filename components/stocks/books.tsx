'use client'

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ncWsA58mcHs
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'
import { BookMetadata, BookMetadataReduced } from '@/lib/book/books-api'
import { BookCard } from './Book-card'

export function Books({ props: books }: { props: BookMetadata[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { selectBook } = useActions()

  return (
    <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm sm:flex-row">
      {books.map(book => (
        <button
          key={book.id}
          className="flex cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-700 sm:w-52"
          onClick={async () => {
            const response = await selectBook(book)

            // Insert a new system message to the UI.
            setMessages((currentMessages: any) => [
              ...currentMessages,
              response.newMessage,
              response.bookMessage
            ])
          }}
        >
          <BookCard
            props={book}
            height={600}
            width={400}
            orientation="portrait"
            variant="small"
          />
        </button>
      ))}
    </div>
  )
}
