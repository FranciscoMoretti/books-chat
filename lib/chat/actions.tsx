import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage
} from '@/components/stocks'

import { z } from 'zod'
import { Books } from '@/components/stocks/books'
import { BookCard } from '@/components/stocks/Book-card'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { SpinnerMessage } from '@/components/stocks/message'
import {
  BookMetadata,
  BookMetadataReduced,
  fetchVolumesByQuery,
  fetchMultipleBooksByTitleAuthor
} from '../book/books-api'
import {
  BooksDetailsSkeleton,
  BooksSkeleton
} from '@/components/stocks/books-skeleton'
import { headers } from 'next/headers'
import { messageRateLimit } from '../rate-limit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

// TODO Create a function that finds a book based on chatgpt list of books
async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function selectBook(bookMetadata: BookMetadata) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const systemMessage = createStreamableUI(null)
  const bookMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    systemMessage.done(
      <SystemMessage>
        You have selected {bookMetadata.title} by {bookMetadata.author}.
      </SystemMessage>
    )

    bookMessage.done(
      <BotCard>
        <BookCard
          className="transition-all duration-300"
          props={bookMetadata}
          width={400}
          height={600}
          orientation={'portrait'}
          variant="big"
        />
      </BotCard>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(),
        {
          id: nanoid(),
          role: 'system',
          content: `[User has selected ${bookMetadata.title} by ${bookMetadata.author} with id ${bookMetadata.id} ]`
        },
        {
          id: nanoid(),
          role: 'assistant',
          content: `[Shows details about ${bookMetadata.title} by ${bookMetadata.author} with id ${bookMetadata.id} ]`
        }
      ]
    })
  })

  return {
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    },
    bookMessage: {
      id: nanoid(),
      display: bookMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const ip = headers().get('x-real-ip') ?? 'local'
  const rl = await messageRateLimit.limit(ip)

  if (!rl.success) {
    // TODO: Handle returning errors through chat or toast
    return null
  }

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const ui = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `\
You are a book suggestion conversation bot and you can help users find books, and learn about them.
You and the user can discuss books and the user can ask you to suggest or search books, in the UI.

Messages inside [] means that it's a UI element or a user event. For example:
- "[User has selected Clean Code by Robert C. Martin]" means that the user has selected Clean Code book by the author
   Robert C. Martin in the UI.

If the user wants a search or the user message can be transformed to a search query, call \`searchBooksByKeywords\`
  to show a list of books.
If the user wants books on a topic, category or a recommendation, call \`suggestBooks\` to show a list of books.

If the user wants to buy a book, or complete another impossible task, respond that you are a demo and cannot do that.

Besides that, you can also chat with users and share info about the books if needed.`
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    functions: {
      suggestBooks: {
        description: 'Suggest a list of books.',
        parameters: z.object({
          topic: z.string().describe('The topic for suggestions'),
          books: z
            .array(
              z.object({
                title: z.string().describe('The title of the book'),
                author: z.string().describe('The author of the book')
              })
            )
            .max(3)
            .min(3)
        }),
        render: async function* ({ books, topic }) {
          yield (
            <BotCard>
              <BooksSkeleton />
            </BotCard>
          )

          const booksMetadata = await fetchMultipleBooksByTitleAuthor({ books })

          if (booksMetadata === null) {
            console.log(booksMetadata)
            return <div>Fetching Error</div>
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'suggestBooks',
                content: JSON.stringify({ books, topic })
              }
            ]
          })

          return (
            <BotCard>
              <div>
                <Books props={booksMetadata} />
                <div className="p-4 text-center text-sm text-zinc-500">
                  {`Showing AI suggestions for ${topic}`}
                </div>
              </div>
            </BotCard>
          )
        }
      },
      // TODO: Show a ui state that indicates books are being searched
      searchBooksByKeywords: {
        description:
          'Search books on google books based on a query. Build the query with google advanced search operators.',
        parameters: z.object({
          query: z.string().describe('Query to search for the books')
        }),
        render: async function* ({ query }) {
          yield (
            <BotCard>
              <BooksSkeleton />
            </BotCard>
          )

          const booksMetadata = await fetchVolumesByQuery({ query })

          if (booksMetadata === null) {
            return <div>Fetching Error</div>
          }

          // Remove description from metadata to save in AI state
          const bookMetadataReduced = booksMetadata
            .map(book => {
              if (book) {
                const { description, ...rest } = book
                return rest
              }
            })
            .filter(meta => meta != undefined) as BookMetadataReduced[]

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'searchBooksByKeywords',
                content: JSON.stringify(bookMetadataReduced)
              }
            ]
          })

          return (
            <BotCard>
              <div>
                <Books props={booksMetadata} />
                <div className="p-4 text-center text-sm text-zinc-500">
                  {`Showing search results for: ${query}`}
                </div>
              </div>
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase,
    selectBook
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})
