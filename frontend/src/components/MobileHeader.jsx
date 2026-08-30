import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FiMenu, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiSettings, FiBell
} from 'react-icons/fi'
import { BsRobot } from 'react-icons/bs'
import { API_BASE_URL } from '../config'
import { useAuth } from '../hooks/useAuth.js'

export default function MobileHeader({ onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { authenticated: isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getUserInitials = (user) => {
    if (!user || !user.username) return 'U'
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section - Menu + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors md:hidden"
          >
            <FiMenu className="text-xl" />
          </button>
          
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BsRobot className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent no-underline">
              DataForge AI
            </span>
          </Link>
        </div>

        {/* Right Section - Notifications + User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative">
            <FiBell className="text-xl" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.profile_image ? (
                    <img 
                      src={`${API_BASE_URL}${user.profile_image}`} 
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials(user)
                  )}
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg min-w-48 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.profile_image ? (
                          <img 
                            src={`${API_BASE_URL}${user.profile_image}`} 
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getUserInitials(user)
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {user.username}
                        </div>
                        {user.email && (
                          <div className="text-gray-500 text-xs">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser className="text-lg" />
                    Profile Settings
                  </Link>

                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiSettings className="text-lg" />
                    Admin Panel
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="text-lg" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiLogIn className="text-sm" />
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FiUserPlus className="text-sm" />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}