import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { Books } from '@/components/stocks/books'
import { BookCard } from '@/components/stocks/Book-card'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'
import {
  BookMetadata,
  BookMetadataReduced,
  fetchVolumesByQuery,
  fetchMultipleBooksByTitleAuthor,
  fetchVolumeByID
} from '../book/books-api'
import { volumeToMetadata } from '../book/volumeToMetadata'

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
You are a book suggestion conversation bot and you can help users find books, step by step.
You and the user can discuss books and the user can ask you to suggest or find books, in the UI.

Messages inside [] means that it's a UI element or a user event. For example:
- "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
- "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.

If the user wants a search with keyword match, call \`searchBooksByKeywords\` to show a list of books.
If the user wants books on a topic, call \`listBooks\` to show a list of books.
If the user wants to sse book details by its id, call \`viewBookByID\`.

If the user wants to buy a book, or complete another impossible task, respond that you are a demo and cannot do that.

Besides that, you can also chat with users and do some calculations if needed.`
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
      listBooks: {
        description: 'Suggest a list of books to the user.',
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
              <StocksSkeleton />
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
                name: 'listBooks',
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
              <StocksSkeleton />
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
                  {`Showing results for: ${query}`}
                </div>
              </div>
            </BotCard>
          )
        }
      },
      viewBookByID: {
        description: 'Show details about a book by ID.',
        parameters: z.object({
          bookId: z.string().describe('The book ID')
        }),
        render: async function* ({ bookId }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          const bookMetadata = await fetchVolumeByID(bookId)

          if (bookMetadata === null) {
            return <div>content Error</div>
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'viewBookByID',
                content: JSON.stringify(bookMetadata)
              }
            ]
          })

          return (
            <BotCard>
              <BookCard
                props={bookMetadata}
                width={700}
                height={1200}
                orientation={'portrait'}
                variant="big"
              />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        render: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPrice',
                content: JSON.stringify({ symbol, price, delta })
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          numberOfShares: z
            .number()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        render: async function* ({ symbol, price, numberOfShares = 100 }) {
          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPurchase',
                content: JSON.stringify({
                  symbol,
                  price,
                  numberOfShares
                })
              }
            ]
          })

          return (
            <BotCard>
              <Purchase
                props={{
                  numberOfShares,
                  symbol,
                  price: +price,
                  status: 'requires_action'
                }}
              />
            </BotCard>
          )
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        render: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'getEvents',
                content: JSON.stringify(events)
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
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
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
