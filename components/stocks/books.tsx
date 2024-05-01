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
      <div className="p-4 text-center text-sm text-zinc-500">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </div>
    </div>
  )
}
