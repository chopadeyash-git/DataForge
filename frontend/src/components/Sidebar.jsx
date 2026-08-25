import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, FiDatabase, FiTrendingUp, FiSettings, FiZap,
  FiBarChart, FiShield, FiTarget, FiLayers, FiEdit3, FiClock, FiMessageCircle, FiUsers, FiX
} from 'react-icons/fi'
import { BsRobot } from 'react-icons/bs'
import { HiSparkles } from 'react-icons/hi'

const menuSections = [
  {
    title: 'Main',
    items: [
      { path: '/', icon: FiHome, label: 'Dashboard' },
      { path: '/data-cleaning', icon: FiDatabase, label: 'Data Cleaning' },
      { path: '/augmentation', icon: FiZap, label: 'Augmentation' },
      { path: '/analytics', icon: FiTrendingUp, label: 'Analytics' },
      { path: '/history', icon: FiClock, label: 'History' }
    ]
  },
  {
    title: 'Collaboration',
    items: [
      { path: '/projects', icon: FiUsers, label: 'Projects' }
    ]
  },
  {
    title: 'Tools',
    items: [
      { path: '/ai-assistant', icon: FiMessageCircle, label: 'AI Data Chat' },
      { path: '/typo-correction', icon: FiEdit3, label: 'AI Typo Fix' },
      { path: '/data-encryption', icon: FiShield, label: 'Data Encryption' }
    ]
  }
]

export default function Sidebar({ open, onClose, isMobile }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const handleLinkClick = () => {
    if (isMobile) {
      onClose()
    }
  }

  return (
    <div>
      <div className={`sidebar ${isMobile ? (open ? 'open' : 'collapsed') : ''}`}>
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="sidebar-section">
            <div className="sidebar-title">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${active ? 'active' : ''} no-underline`}
                  onClick={handleLinkClick}
                >
                  <Icon className="sidebar-icon" />
                  <span className="no-underline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}