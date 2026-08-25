import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiUsers, FiDatabase, FiActivity, FiTrash2 } from 'react-icons/fi'
import { AuthContext } from '../context/AuthContext'
import { projectAPI } from '../services/projectAPI'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { authenticated, user } = useContext(AuthContext)

  useEffect(() => {
    if (authenticated) {
      fetchProjects()
    } else {
      setLoading(false)
      setError('Please log in to view projects')
    }
  }, [authenticated])

  const handleDeleteProject = async (projectId, projectName) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await projectAPI.deleteProject(projectId)
      await fetchProjects() // Refresh the list
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch real projects from API
      const projectsData = await projectAPI.getProjects()
      setProjects(projectsData)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500 mb-6">Please log in to access your projects</p>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Collaborate on datasets with your team</p>
          </div>
          <Link
            to="/projects/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative"
            >
              {project.is_creator && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteProject(project.id, project.name)
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete project"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
              
              <Link to={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.organization}</p>
                    {project.user_role && (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        project.is_creator 
                          ? 'bg-blue-100 text-blue-800' 
                          : project.user_role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {project.is_creator ? 'Creator' : project.user_role}
                      </span>
                    )}
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiUsers className="w-4 h-4" />
                    <span>{project.member_count || 1} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiDatabase className="w-4 h-4" />
                    <span>{project.dataset_count || 0} datasets</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiActivity className="w-4 h-4" />
                    <span>Created {project.created_date_formatted || new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to start collaborating</p>
              <Link
                to="/projects/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}