import { useMemo } from 'react'
import { useWorkflow } from '../hooks/useWorkflow.js'
import { FiSettings, FiDatabase, FiTrendingUp, FiArrowRight, FiCheckCircle } from 'react-icons/fi'

export default function ProjectConfiguration({ onContinue }) {
  const { summary, config, setConfig } = useWorkflow()

  // Filter columns for imputation
  const availableColumns = useMemo(() => {
    if (!summary) return []
    return summary.column_names
  }, [summary])

  const handleContinue = () => {
    if (onContinue) onContinue()
  }

  if (!summary) {
    return (
      <div className="configuration-page">
        <div className="no-data-container">
          <div className="no-data-card">
            <div className="no-data-icon">
              <FiDatabase size={64} />
            </div>
            <h2 className="no-data-title">No Data Available</h2>
            <p className="no-data-description">
              Please upload a file first to configure processing settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="configuration-page">
      <div className="configuration-container">
        {/* Enhanced Header */}
        <div className="configuration-header">
          <div className="header-content">
            <div className="header-icon">
              <FiSettings size={48} />
            </div>
            <h1 className="header-title">Processing Configuration</h1>
            <p className="header-subtitle">
              Configure data processing settings and parameters
            </p>
          </div>
        </div>

        {/* Missing Value Imputation Section */}
        <div className="config-section">
          <h3 className="section-title">
            <FiDatabase size={24} />
            Missing Value Imputation
          </h3>
          <div className="config-grid">
            <div className="config-card">
              <label className="config-label">Imputation Method</label>
              <select 
                className="config-select"
                value={config.imputation.method} 
                onChange={(e) => setConfig(c => ({
                  ...c, 
                  imputation: { ...c.imputation, method: e.target.value }
                }))}
              >
                <option value="mean">Mean</option>
                <option value="median">Median</option>
                <option value="mode">Mode</option>
                <option value="drop">Drop Rows</option>
              </select>
              <p className="config-description">
                Choose how to handle missing values in numeric columns
              </p>
            </div>

            <div className="config-card">
              <label className="config-label">Text Imputation</label>
              <select 
                className="config-select"
                value={config.imputation.textMethod} 
                onChange={(e) => setConfig(c => ({
                  ...c, 
                  imputation: { ...c.imputation, textMethod: e.target.value }
                }))}
              >
                <option value="mode">Mode (Most Common)</option>
                <option value="drop">Drop Rows</option>
                <option value="fill">Fill with "Unknown"</option>
              </select>
              <p className="config-description">
                Choose how to handle missing values in text columns
              </p>
            </div>
          </div>
        </div>

        {/* Data Cleaning Options */}
        <div className="config-section">
          <h3 className="section-title">
            <FiTrendingUp size={24} />
            Data Cleaning Options
          </h3>
          <div className="config-grid">
            <div className="config-card">
              <label className="config-label">Remove Duplicates</label>
              <div className="toggle-container">
                <input
                  type="checkbox"
                  id="removeDuplicates"
                  checked={config.cleaning.removeDuplicates}
                  onChange={(e) => setConfig(c => ({
                    ...c,
                    cleaning: { ...c.cleaning, removeDuplicates: e.target.checked }
                  }))}
                  className="toggle-input"
                />
                <label htmlFor="removeDuplicates" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="config-description">
                Remove duplicate rows from the dataset
              </p>
            </div>

            <div className="config-card">
              <label className="config-label">Standardize Text</label>
              <div className="toggle-container">
                <input
                  type="checkbox"
                  id="standardizeText"
                  checked={config.cleaning.standardizeText}
                  onChange={(e) => setConfig(c => ({
                    ...c,
                    cleaning: { ...c.cleaning, standardizeText: e.target.checked }
                  }))}
                  className="toggle-input"
                />
                <label htmlFor="standardizeText" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="config-description">
                Convert text to lowercase and trim whitespace
              </p>
            </div>

            <div className="config-card">
              <label className="config-label">Handle Outliers</label>
              <div className="toggle-container">
                <input
                  type="checkbox"
                  id="handleOutliers"
                  checked={config.cleaning.handleOutliers}
                  onChange={(e) => setConfig(c => ({
                    ...c,
                    cleaning: { ...c.cleaning, handleOutliers: e.target.checked }
                  }))}
                  className="toggle-input"
                />
                <label htmlFor="handleOutliers" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="config-description">
                Detect and handle outliers in numeric columns
              </p>
            </div>

            <div className="config-card">
              <label className="config-label">Data Validation</label>
              <div className="toggle-container">
                <input
                  type="checkbox"
                  id="dataValidation"
                  checked={config.cleaning.dataValidation}
                  onChange={(e) => setConfig(c => ({
                    ...c,
                    cleaning: { ...c.cleaning, dataValidation: e.target.checked }
                  }))}
                  className="toggle-input"
                />
                <label htmlFor="dataValidation" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="config-description">
                Validate data types and ranges
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="action-section">
          <button 
            className="btn btn-primary continue-button"
            onClick={handleContinue}
          >
            <span>Continue to Next Step</span>
            <FiArrowRight size={20} />
          </button>
        </div>
      </div>
      
      <style jsx="true">{`
        .configuration-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .configuration-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }
        
        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }
        
        .config-section {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .config-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .config-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        
        .config-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          margin-bottom: 0.5rem;
        }
        
        .toggle-container {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .toggle-input {
          display: none;
        }
        
        .toggle-label {
          position: relative;
          width: 50px;
          height: 24px;
          background: #cbd5e0;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .toggle-input:checked + .toggle-label {
          background: #3b82f6;
        }
        
        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }
        
        .toggle-input:checked + .toggle-label .toggle-slider {
          transform: translateX(26px);
        }
        
        .config-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .action-section {
          text-align: center;
          padding: 2rem;
        }
        
        .continue-button {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.2s;
        }
        
        .continue-button:hover {
          transform: translateY(-2px);
        }
        
        .no-data-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        
        .no-data-card {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}