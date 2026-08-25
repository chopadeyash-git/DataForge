# Refinify Project Collaboration System

## Overview

This implementation adds a unified operation-based collaboration system to Refinify, allowing teams to work together on datasets through versioned operations.

## Architecture

```
Organization
└── Project
    ├── Project Members (admin/editor/viewer)
    ├── Dataset Versions (v1, v2, v3...)
    ├── Operations (applied to create new versions)
    └── Activity Log (all team actions)
```

## Key Features

### ✅ Operation-Based Collaboration
- All dataset changes happen through operations
- Each operation creates a new dataset version
- Full version history and lineage tracking
- No direct dataset modification allowed

### ✅ Team Management
- Organization-level project grouping
- Role-based permissions (admin/editor/viewer)
- Activity logging for all team actions

### ✅ Version Control
- Automatic dataset versioning
- Parent-child version relationships
- Operation history with parameters
- File storage with organized structure

## Installation

### 1. Install Dependencies
```bash
cd backend
pip install flask-jwt-extended sqlalchemy flask-sqlalchemy
```

### 2. Create Database Tables
```bash
python migrate_project_tables.py
```

### 3. Integrate with Existing App
Add to your `app.py`:
```python
from project_integration import integrate_project_collaboration
integrate_project_collaboration(app, db)
```

## File Structure

```
backend/
├── models/
│   └── project_models.py          # Core collaboration models
├── services/
│   └── project_operation_engine.py # Operation processing engine
├── routes/
│   └── project_routes.py          # API endpoints
├── storage/
│   └── projects/                  # File storage structure
│       └── {project_id}/
│           └── datasets/
│               └── {dataset_id}/
│                   ├── version_1.csv
│                   ├── version_2.csv
│                   └── version_3.csv
└── project_integration.py         # Integration helper
```

## API Endpoints

### Project Management
- `POST /api/v2/projects/create` - Create new project
- `POST /api/v2/projects/add-member` - Add team member

### Dataset Operations
- `POST /api/v2/projects/{id}/datasets/add` - Upload initial dataset
- `POST /api/v2/projects/{id}/operations/apply` - Apply operation

### Data Access
- `GET /api/v2/projects/{id}/datasets` - List all dataset versions
- `GET /api/v2/projects/{id}/operations` - Operation history
- `GET /api/v2/projects/{id}/versions` - Version history
- `GET /api/v2/projects/{id}/activity` - Team activity log

## Usage Examples

### 1. Create Project and Add Dataset
```javascript
// Create project
const project = await fetch('/api/v2/projects/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sales Analysis Project',
    organization: 'Data Team'
  })
});

// Add dataset
const formData = new FormData();
formData.append('file', csvFile);
await fetch(`/api/v2/projects/${project.id}/datasets/add`, {
  method: 'POST',
  body: formData
});
```

### 2. Apply Operations
```javascript
// Clean data operation
await fetch(`/api/v2/projects/${projectId}/operations/apply`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataset_version_id: currentVersionId,
    operation_type: 'clean_data',
    parameters: {
      remove_duplicates: true,
      fix_missing: true
    }
  })
});
```

### 3. View Version History
```javascript
const versions = await fetch(`/api/v2/projects/${projectId}/versions`);
// Returns: [
//   { id: 3, version_number: 3, parent_version_id: 2, created_by: 1 },
//   { id: 2, version_number: 2, parent_version_id: 1, created_by: 2 },
//   { id: 1, version_number: 1, parent_version_id: null, created_by: 1 }
// ]
```

## Operation Types

The system supports these operation types:

### Data Cleaning
- `clean_data` - Comprehensive data cleaning
- `fill_missing` - Missing value imputation
- `remove_outliers` - Outlier detection and removal

### Data Transformation
- `augment_data` - Data augmentation
- `normalize_data` - Data normalization
- `feature_engineering` - Create new features

### Custom Operations
Extend the `ProjectOperationEngine` to add new operation types:

```python
def _apply_operation_logic(self, df, operation_type, parameters):
    if operation_type == 'custom_transform':
        return self._custom_transform(df, parameters)
    # ... existing operations
```

## Permissions

### Admin
- Add/remove team members
- Apply all operations
- Delete project

### Editor  
- Apply operations
- View all data

### Viewer
- Read-only access
- View history and activity

## Integration with Existing Features

### ✅ Preserves Existing Functionality
- All existing `/api/augmentation`, `/api/typo`, `/api/analytics` routes work unchanged
- Existing upload and processing features remain intact
- No breaking changes to current frontend

### ✅ Extends Current System
- Uses existing data processing functions
- Leverages current AI cleaning and augmentation logic
- Maintains compatibility with current file formats

## Frontend Integration

Add these new pages to your React frontend:

```
/projects                    # Project list
/projects/{id}              # Project dashboard  
/projects/{id}/datasets     # Dataset versions
/projects/{id}/versions     # Version history
```

Example React component:
```jsx
function ProjectDashboard({ projectId }) {
  const [versions, setVersions] = useState([]);
  
  useEffect(() => {
    fetch(`/api/v2/projects/${projectId}/versions`)
      .then(res => res.json())
      .then(setVersions);
  }, [projectId]);
  
  return (
    <div>
      <h2>Dataset Versions</h2>
      {versions.map(version => (
        <div key={version.id}>
          Version {version.version_number} 
          (created by user {version.created_by})
        </div>
      ))}
    </div>
  );
}
```

## Database Schema

### Organizations
- `id` - Primary key
- `name` - Organization name
- `created_by` - Creator user ID
- `created_at` - Creation timestamp

### Projects  
- `id` - Primary key
- `name` - Project name
- `organization_id` - Foreign key to organizations
- `created_by` - Creator user ID
- `created_at` - Creation timestamp

### ProjectMembers
- `id` - Primary key
- `project_id` - Foreign key to projects
- `user_id` - Foreign key to users
- `role` - admin/editor/viewer
- `created_at` - Join timestamp

### DatasetVersions
- `id` - Primary key
- `dataset_id` - Logical dataset identifier
- `project_id` - Foreign key to projects
- `version_number` - Sequential version number
- `parent_version_id` - Foreign key to parent version
- `file_path` - Path to CSV file
- `created_by` - Creator user ID
- `created_at` - Creation timestamp

### Operations
- `id` - Primary key
- `project_id` - Foreign key to projects
- `dataset_version_id` - Foreign key to dataset versions
- `operation_type` - Type of operation applied
- `parameters` - JSON parameters
- `created_by` - User who applied operation
- `created_at` - Operation timestamp

### ProjectActivities
- `id` - Primary key
- `project_id` - Foreign key to projects
- `user_id` - User who performed action
- `action` - Action type
- `metadata` - JSON metadata
- `created_at` - Activity timestamp

## Security

### Authentication
- JWT-based authentication for all endpoints
- User identity verification for all operations

### Authorization
- Role-based access control
- Project membership verification
- Operation permission checks

### Data Protection
- Organized file storage by project
- No direct file system access
- Audit trail for all changes

## Troubleshooting

### Common Issues

1. **JWT Token Errors**
   ```bash
   pip install flask-jwt-extended
   # Restart application
   ```

2. **Database Table Missing**
   ```bash
   python migrate_project_tables.py
   ```

3. **Permission Denied**
   - Check user is project member
   - Verify role permissions
   - Ensure JWT token is valid

4. **File Not Found**
   - Check storage directory exists
   - Verify file path in database
   - Ensure proper permissions

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Deployment

### Environment Variables
```bash
export JWT_SECRET_KEY="your-production-secret"
export DATABASE_URL="postgresql://user:pass@host:port/db"
export STORAGE_PATH="/app/storage"
```

### Storage Considerations
- Use cloud storage (S3, GCS) for production
- Implement file cleanup policies
- Monitor storage usage

### Performance
- Index frequently queried columns
- Implement pagination for large datasets
- Cache operation results

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration notifications
- [ ] Operation rollback/undo
- [ ] Branch/merge workflows
- [ ] Advanced permission granularity
- [ ] Integration with external data sources
- [ ] Automated testing pipelines

### Extension Points
- Custom operation types
- External storage backends
- Advanced workflow engines
- Integration APIs

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoint documentation
3. Examine operation logs
4. Test with minimal examples

This implementation provides a solid foundation for team-based data collaboration while preserving all existing Refinify functionality.