# Books Chat

Chat with aI and get books recommendations. An AI chatbot with server-side rendering generative UI.

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for OpenAI (default), Anthropic, Cohere, Hugging Face, or custom AI chat models and/or LangChain
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- Rate limiting[Vercel KV](https://vercel.com/storage/kv)
- Books with [Google Books API](https://developers.google.com/books)



## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Books AI Chatbot.


1. Create a `.env` file and add your environment variables
```bash
cp .env.example .env
```

2. Install and run the app
```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).


## Template
This is based on [Vercel AI Chatbot template](https://github.com/vercel/ai-chatbot).
