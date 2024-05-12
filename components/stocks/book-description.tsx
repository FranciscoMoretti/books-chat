'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

export function BookDescription({
  descriptionHtml
}: {
  descriptionHtml: string
}) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div
        className={cn(
          'text-gray-500 dark:text-gray-400 prose py-4',
          !showAll && 'max-h-[300px] overflow-y-hidden'
        )}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      ></div>
      <div className="flex items-center gap-2">
        <button
          className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  )
}
