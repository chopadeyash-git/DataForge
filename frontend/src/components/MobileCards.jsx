// Mobile-First Card Component
export function MobileCard({ children, className = "", onClick, hover = true }) {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
        hover ? 'hover:shadow-md' : ''
      } ${onClick ? 'cursor-pointer' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Mobile-First Stat Card
export function MobileStatCard({ title, value, change, icon: Icon, color = "#3B82F6", trend = "up" }) {
  return (
    <MobileCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="text-lg" style={{ color }} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-gray-600 font-medium text-sm">{title}</div>
    </MobileCard>
  )
}

// Mobile-First Action Card
export function MobileActionCard({ title, description, icon: Icon, color = "#3B82F6", onClick, href }) {
  const content = (
    <>
      <div className="p-3 rounded-xl mb-4 mx-auto w-fit" style={{ backgroundColor: `${color}20` }}>
        <Icon className="text-2xl" style={{ color }} />
      </div>
      <div className="text-center">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
          {title}
        </h4>
        <p className="text-gray-600 text-xs leading-relaxed">
          {description}
        </p>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className="block">
        <MobileCard className="p-4 text-center hover:shadow-lg hover:-translate-y-1">
          {content}
        </MobileCard>
      </a>
    )
  }

  return (
    <MobileCard className="p-4 text-center hover:shadow-lg hover:-translate-y-1" onClick={onClick}>
      {content}
    </MobileCard>
  )
}

// Mobile-First List Item
export function MobileListItem({ title, description, timestamp, status, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon className="text-lg" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 mb-1 text-sm">
          {title}
        </h4>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
          {description}
        </p>
        {timestamp && (
          <span className="text-gray-500 text-xs">
            {timestamp}
          </span>
        )}
      </div>
      {status && (
        <span className="px-2 py-1 text-xs font-medium rounded-full flex-shrink-0" style={{ 
          backgroundColor: `${color}20`,
          color: color
        }}>
          {status}
        </span>
      )}
    </div>
  )
}