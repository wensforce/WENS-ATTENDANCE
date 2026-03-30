import React from 'react'

/* Reusable shimmer block */
const Sk = ({ className = '' }) => (
  <div
    className={`bg-border rounded animate-pulse ${className}`}
    style={{ opacity: 0.7 }}
  />
)

const SkeletonLoading = () => {
  return (
    <div className="w-full p-4 bg-background min-h-screen">

      {/* ── Header: greeting + toggle ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-2">
          <Sk className="h-6 w-52 rounded-lg" />
          <Sk className="h-4 w-28 rounded-md" />
        </div>
        <Sk className="h-9 w-28 rounded-lg" />
      </div>

      {/* ── Stats Cards (2-col grid) ── */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        {[0, 1].map(i => (
          <div
            key={i}
            className="rounded-2xl p-3 flex items-center gap-2 bg-surface border border-border"
          >
            <Sk className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Sk className="h-3 w-20 rounded" />
              <Sk className="h-4 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Check-In Button ── */}
      <div className="flex flex-col items-center mb-8">
        <Sk className="w-40 h-40 rounded-full" />
      </div>

      {/* ── Current Location ── */}
      <div className="text-center mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <Sk className="w-4 h-4 rounded" />
          <Sk className="h-3 w-32 rounded" />
        </div>
        <Sk className="h-3 w-56 rounded" />
      </div>

      {/* ── Today's Summary header ── */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <Sk className="h-7 w-44 rounded-lg" />
        <Sk className="w-9 h-9 rounded-lg" />
      </div>

      {/* ── Summary Card ── */}
      <div className="border border-border shadow-md rounded-2xl bg-surface py-3 px-8">
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <div className="py-5 flex items-center justify-between">
              {/* left: icon + label */}
              <div className="flex gap-2 items-center">
                <Sk className="w-10 h-10 rounded-full shrink-0" />
                <Sk className="h-4 w-24 rounded" />
              </div>
              {/* right: value */}
              <Sk className="h-5 w-16 rounded" />
            </div>
            {i < 2 && <hr className="border-border" />}
          </React.Fragment>
        ))}
      </div>

    </div>
  )
}

export default SkeletonLoading