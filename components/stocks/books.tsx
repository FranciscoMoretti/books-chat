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
    <div className="mb-4 grid grid-cols-3 gap-2 pb-4 text-sm sm:flex-row">
      {books.map(book => (
        <button
          key={book.id}
          className="flex items-stretch cursor-pointer flex-row"
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
            height={300}
            width={225}
            orientation="portrait"
            variant="small"
          />
        </button>
      ))}
    </div>
  )
}
