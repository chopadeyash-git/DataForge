import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, FiZap, FiTrendingUp, FiMessageCircle, FiUser
} from 'react-icons/fi'

const navItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/augmentation', icon: FiZap, label: 'Augmentation' },
  { path: '/ai-assistant', icon: FiMessageCircle, label: 'AI Chat' },
  { path: '/analytics', icon: FiTrendingUp, label: 'Analytics' },
  { path: '/profile', icon: FiUser, label: 'Profile' }
]

export default function MobileBottomNav() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-3 px-2 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-200 min-w-0 flex-1 mx-1 ${
                active 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`text-xl mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium truncate ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}