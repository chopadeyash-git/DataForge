import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false) // Close mobile sidebar when switching to desktop
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Only on mobile */}
      {isMobile ? (
        <MobileHeader onToggleSidebar={toggleSidebar} />
      ) : (
        <Navbar onToggleSidebar={toggleSidebar} />
      )}
      
      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isMobile 
          ? 'pt-16 pb-20' // Mobile: top padding for header, bottom padding for nav
          : 'pt-16 md:ml-64' // Desktop: top padding for navbar, left margin for sidebar
      }`}>
        <div className="min-h-full">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Only on mobile */}
      {isMobile && <MobileBottomNav />}
    </div>
  )
}