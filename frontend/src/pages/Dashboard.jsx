import { useState, useEffect } from 'react'
import { 
  FiDatabase, FiZap, FiShield, FiTrendingUp, 
  FiUsers, FiGlobe, FiAward, FiTarget, FiArrowRight,
  FiCheckCircle, FiBarChart, FiSettings, FiActivity,
  FiClock, FiFileText, FiDownload, FiPlus, FiEye
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import { BsRobot, BsLightbulb } from 'react-icons/bs'
import { API_BASE_URL } from '../config.js'

// Utility function for status colors
function getStatusColor(status) {
  switch (status) {
    case 'completed': return '#10B981'
    case 'processing': return '#3B82F6'
    case 'review': return '#F59E0B'
    case 'failed': return '#EF4444'
    default: return '#6B7280'
  }
}

const quickStats = [
  { 
    title: 'Active Projects', 
    value: '12', 
    change: '+18%', 
    icon: FiDatabase, 
    color: '#3B82F6',
    trend: 'up'
  },
  { 
    title: 'Data Processed', 
    value: '2.4TB', 
    change: '+32%', 
    icon: FiActivity, 
    color: '#10B981',
    trend: 'up'
  },
  { 
    title: 'Quality Score', 
    value: '97.8%', 
    change: '+2.1%', 
    icon: FiTrendingUp, 
    color: '#8B5CF6',
    trend: 'up'
  },
  { 
    title: 'AI Features', 
    value: '14+', 
    change: 'New!', 
    icon: BsRobot, 
    color: '#F59E0B',
    trend: 'up'
  }
]

const recentActivity = [
  {
    type: 'advanced_cleaning',
    title: 'Advanced data cleaning completed',
    description: 'Removed duplicates, fixed labels, handled outliers',
    timestamp: '1 hour ago',
    status: 'completed',
    icon: HiSparkles
  },
  {
    type: 'synthetic_data',
    title: 'Synthetic data generated',
    description: 'SMOTE augmentation: 10K → 25K samples',
    timestamp: '2 hours ago',
    status: 'completed',
    icon: BsRobot
  },
  {
    type: 'privacy_protection',
    title: 'Privacy protection applied',
    description: 'PII detected and anonymized in 5 columns',
    timestamp: '3 hours ago',
    status: 'completed',
    icon: FiShield
  },
  {
    type: 'typo_correction',
    title: 'AI typo correction',
    description: 'Fixed 234 typos using Gemini AI',
    timestamp: '4 hours ago',
    status: 'completed',
    icon: FiCheckCircle
  }
]

const datasetTypes = [
  { name: 'Customer Data', count: 45, percentage: 35, color: '#3B82F6' },
  { name: 'Sales Records', count: 32, percentage: 25, color: '#10B981' },
  { name: 'Product Catalog', count: 28, percentage: 22, color: '#8B5CF6' },
  { name: 'Marketing Data', count: 23, percentage: 18, color: '#F59E0B' }
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data from:', `${API_BASE_URL}/api/dashboard`)
      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Dashboard response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard data received:', data)
        setStats(data)
      } else {
        console.error('Dashboard response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set some default stats to prevent UI issues
      setStats({
        user_datasets: 0,
        user_runs: 0,
        user_role: 'guest'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <BsRobot className="text-6xl md:text-8xl" />
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <FiBarChart className="text-2xl md:text-4xl" />
                <h1 className="text-2xl md:text-4xl font-bold">
                  Dashboard
                </h1>
              </div>
              <p className="text-base md:text-xl opacity-90 max-w-2xl">
                Monitor your AI-powered data processing with advanced cleaning, synthetic data generation, and privacy protection.
              </p>
            </div>
            
            <div className="flex gap-2 md:gap-3">
              <button className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm text-sm md:text-base">
                <FiDownload />
                <span className="hidden sm:inline">Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon className="text-lg md:text-2xl" style={{ color: stat.color }} />
                </div>
                <span className={`text-xs md:text-sm font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium text-xs md:text-base">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h3 className="flex items-center gap-3 text-lg md:text-xl font-semibold text-gray-900">
                <FiActivity className="text-blue-600" />
                Recent Activity
              </h3>
            </div>
            <div className="p-0">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 md:gap-4 p-4 md:p-6 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0">
                  <div className="p-2 md:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${getStatusColor(activity.status)}20` }}>
                    <activity.icon className="text-lg md:text-xl" style={{ color: getStatusColor(activity.status) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                      {activity.title}
                    </h4>
                    <p className="text-gray-600 text-xs md:text-sm mb-2 line-clamp-2">
                      {activity.description}
                    </p>
                    <span className="text-gray-500 text-xs">
                      {activity.timestamp}
                    </span>
                  </div>
                  <span className="px-2 md:px-3 py-1 text-xs font-medium rounded-full flex-shrink-0" style={{ 
                    backgroundColor: `${getStatusColor(activity.status)}20`,
                    color: getStatusColor(activity.status)
                  }}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset Distribution */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h3 className="flex items-center gap-3 text-lg md:text-xl font-semibold text-gray-900">
                <FiDatabase className="text-blue-600" />
                Dataset Types
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {datasetTypes.map((type, index) => (
                <div key={index} className="mb-4 md:mb-6 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 text-sm md:text-base">
                      {type.name}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {type.count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                      width: `${type.percentage}%`,
                      backgroundColor: type.color
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <FiZap className="text-blue-600" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FiDatabase, title: 'Data Cleaning', description: 'Professional data cleaning pipeline', color: '#3B82F6', path: '/data-cleaning' },
                { icon: FiZap, title: 'Augmentation', description: 'Real-time data augmentation with AI', color: '#8B5CF6', path: '/augmentation' },
                { icon: FiTrendingUp, title: 'Analytics', description: 'Advanced data visualization', color: '#10B981', path: '/analytics' },
                { icon: BsRobot, title: 'AI Data Chat', description: 'Natural language data queries', color: '#F59E0B', path: '/ai-assistant' },
                { icon: FiCheckCircle, title: 'AI Typo Fix', description: 'Advanced text correction', color: '#EF4444', path: '/typo-correction' },
                { icon: FiShield, title: 'Data Encryption', description: 'Secure data protection', color: '#6B7280', path: '/data-encryption' }
              ].map((action, index) => (
                <a key={index} href={action.path} className="group flex flex-col items-center gap-4 p-6 bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 text-decoration-none">
                  <div className="p-4 rounded-xl transition-all duration-200 group-hover:scale-110" style={{ backgroundColor: `${action.color}20` }}>
                    <action.icon className="text-2xl" style={{ color: action.color }} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* AI Features Showcase */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <BsRobot className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🚀 Advanced AI Features Available
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Leverage cutting-edge AI technology for comprehensive data processing, cleaning, and augmentation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FiDatabase,
                title: 'Data Cleaning',
                description: 'Professional data cleaning pipeline with outlier detection and missing value imputation',
                color: '#3B82F6',
                features: ['Outlier Detection', 'Missing Values', 'Data Validation']
              },
              {
                icon: FiZap,
                title: 'Real-Time Augmentation',
                description: 'AI-powered data augmentation with voice commands and natural language processing',
                color: '#8B5CF6',
                features: ['Voice Commands', 'Gemini AI', 'Real-time Processing']
              },
              {
                icon: FiTrendingUp,
                title: 'Advanced Analytics',
                description: 'Interactive data visualization with custom charts and statistical analysis',
                color: '#10B981',
                features: ['Custom Charts', 'Statistical Analysis', 'Data Visualization']
              },
              {
                icon: BsRobot,
                title: 'AI Data Assistant',
                description: 'Natural language queries for data exploration and manipulation',
                color: '#F59E0B',
                features: ['Natural Language', 'Data Queries', 'Smart Recommendations']
              },
              {
                icon: FiCheckCircle,
                title: 'AI Typo Correction',
                description: 'Multiple AI models including Gemini, T5, and BERT for text enhancement',
                color: '#EF4444',
                features: ['Gemini AI', 'T5 Model', 'Grammar Correction']
              },
              {
                icon: FiShield,
                title: 'Data Encryption',
                description: 'Enterprise-grade security with PBKDF2 encryption and secure processing',
                color: '#6B7280',
                features: ['PBKDF2 Encryption', 'Secure Processing', 'Data Protection']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${feature.color}20` }}>
                    <feature.icon className="text-2xl" style={{ color: feature.color }} />
                  </div>
                  <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((feat, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Message for New Users */}
        {(!stats || stats.user_datasets === 0) && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-blue-200">
            <HiSparkles className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to DataForge AI - AI Data Processing Platform!
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get started by uploading your first dataset. Our AI-powered tools will help you clean, analyze, and visualize your data with professional-grade quality.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/data-cleaning" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 text-decoration-none">
                <FiPlus />
                Upload Your First Dataset
              </a>
              <a href="/advanced-cleaning" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors duration-200 text-decoration-none">
                <FiEye />
                Try Demo Features
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}