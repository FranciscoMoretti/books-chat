import React from 'react'

import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <footer className="border-t border-t-secondary w-full">
      <div className="flex container flex-col items-center justify-center gap-2 md:flex-row py-4  ">
        <div className="flex flex-col items-center md:flex-row gap-2 ">
          <p className="px-2 text-center text-xs leading-normal text-muted-foreground">
            Built by{' '}
            <ExternalLink href={'https://twitter.com/franmoretti_'}>
              franmoretti_
            </ExternalLink>
            . Open source on{' '}
            <ExternalLink
              href={'https://github.com/FranciscoMoretti/books-chat'}
            >
              GitHub
            </ExternalLink>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
