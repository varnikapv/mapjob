export default function SavedDrawer({
  title,
  jobs,
  badgeLabel,       // fn(job) => string | null — extra badge on each card
  emptyIcon,
  emptyText,
  onJobSelect,
  onRemove,
  removeLabel = 'Remove',
  onClose,
}) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 bg-card border-l border-border shadow-xl flex flex-col overflow-hidden"
      style={{ width: 360, zIndex: 30 }}
    >
      {/* Header */}
      <div className="p-4 bg-cream border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <p className="text-[10px] font-body text-muted mt-0.5">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-muted hover:text-ink transition-colors text-sm"
        >
          &times;
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <p className="text-4xl mb-3 text-muted">{emptyIcon}</p>
            <p className="font-display text-base font-semibold text-ink">{emptyText.title}</p>
            <p className="text-xs font-body text-muted mt-1.5 leading-relaxed">{emptyText.body}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map(job => {
              const badge = badgeLabel?.(job)
              return (
                <div key={job.job_id} className="p-4 hover:bg-cream/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {job.employer_logo ? (
                      <img
                        src={job.employer_logo}
                        alt=""
                        className="w-8 h-8 rounded object-contain bg-white border border-border shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-paper border border-border flex items-center justify-center text-muted font-body text-xs shrink-0 mt-0.5">
                        {(job.employer_name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-ink leading-snug line-clamp-2">
                        {job.job_title}
                      </p>
                      <p className="text-[10px] font-body text-accent mt-0.5 truncate">
                        {job.employer_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {badge && (
                          <span className="text-[9px] font-body font-medium px-1.5 py-0.5 rounded-full bg-accent2/10 text-accent2 border border-accent2/20">
                            {badge}
                          </span>
                        )}
                        {job.job_is_remote && (
                          <span className="text-[9px] font-body text-muted">Remote</span>
                        )}
                        {job.job_employment_type && (
                          <span className="text-[9px] font-body text-muted">
                            {job.job_employment_type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onJobSelect(job)}
                      className="flex-1 py-1.5 rounded text-[10px] font-body font-medium bg-ink text-white hover:bg-accent transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onRemove(job)}
                      className="px-3 py-1.5 rounded text-[10px] font-body text-muted border border-border hover:border-accent hover:text-accent transition-colors"
                    >
                      {removeLabel}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
