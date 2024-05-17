export const BooksSkeleton = () => {
  return (
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 pb-4 text-sm">
      <div className="flex h-[520px] w-full cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-800 sm:w-[208px]"></div>
      <div className="flex h-[520px] w-full cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-800 sm:w-[208px]"></div>
      <div className="flex h-[520px] w-full cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-800 sm:w-[208px]"></div>
    </div>
  )
}
