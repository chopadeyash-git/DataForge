export default function MobilePage({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  headerActions,
  className = "" 
}) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon className="text-white text-lg" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}