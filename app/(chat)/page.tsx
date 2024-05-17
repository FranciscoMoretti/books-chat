import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { getMissingKeys } from '../actions'

export const metadata = {
  title: 'Books AI Chatbot'
}

export default async function IndexPage() {
  const id = nanoid()
  const missingKeys = await getMissingKeys()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} missingKeys={missingKeys} />
    </AI>
  )
}
