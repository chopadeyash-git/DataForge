import os
import pandas as pd
import json
from datetime import datetime
from models.project_models import db, Project, ProjectMember, DatasetVersion, Operation, ProjectActivity
# Import existing services with fallback
try:
    from augmentation_service import AugmentationService
    data_augmenter = AugmentationService()
except ImportError:
    data_augmenter = None

try:
    from advanced_data_cleaner import AdvancedDataCleaner
    data_cleaner = AdvancedDataCleaner()
except ImportError:
    data_cleaner = None

class ProjectOperationEngine:
    def __init__(self):
        self.storage_base = "storage/projects"
        # Import existing services with fallback
        try:
            from augmentation_service import AugmentationService
            self.data_augmenter = AugmentationService()
        except ImportError:
            self.data_augmenter = None
        
        try:
            from advanced_data_cleaner import AdvancedDataCleaner
            self.data_cleaner = AdvancedDataCleaner()
        except ImportError:
            self.data_cleaner = None
    
    def verify_user_access(self, project_id, user_id, required_role='viewer'):
        member = ProjectMember.query.filter_by(
            project_id=project_id, 
            user_id=user_id
        ).first()
        
        if not member:
            return False
            
        role_hierarchy = {'viewer': 0, 'editor': 1, 'admin': 2}
        return role_hierarchy.get(member.role, 0) >= role_hierarchy.get(required_role, 0)
    
    def get_storage_path(self, project_id, dataset_id, version):
        return os.path.join(
            self.storage_base, 
            str(project_id), 
            "datasets", 
            str(dataset_id), 
            f"version_{version}.csv"
        )
    
    def ensure_storage_directory(self, project_id, dataset_id):
        path = os.path.join(self.storage_base, str(project_id), "datasets", str(dataset_id))
        os.makedirs(path, exist_ok=True)
        return path
    
    def apply_operation(self, project_id, dataset_version_id, operation_type, parameters, user_id):
        # Verify user access
        if not self.verify_user_access(project_id, user_id, 'editor'):
            raise PermissionError("User does not have permission to apply operations")
        
        # Get current dataset version
        current_version = DatasetVersion.query.get(dataset_version_id)
        if not current_version:
            raise ValueError("Dataset version not found")
        
        # Load dataset
        df = pd.read_csv(current_version.file_path)
        
        # Apply operation using existing logic
        processed_df = self._apply_operation_logic(df, operation_type, parameters)
        
        # Create new version
        new_version_number = self._get_next_version_number(current_version.dataset_id, project_id)
        new_file_path = self.get_storage_path(project_id, current_version.dataset_id, new_version_number)
        
        # Ensure directory exists
        self.ensure_storage_directory(project_id, current_version.dataset_id)
        
        # Save processed data
        processed_df.to_csv(new_file_path, index=False)
        
        # Create new dataset version record
        new_version = DatasetVersion(
            dataset_id=current_version.dataset_id,
            project_id=project_id,
            version_number=new_version_number,
            parent_version_id=dataset_version_id,
            file_path=new_file_path,
            created_by=user_id
        )
        db.session.add(new_version)
        db.session.flush()
        
        # Create operation record
        operation = Operation(
            project_id=project_id,
            dataset_version_id=new_version.id,
            operation_type=operation_type,
            parameters=json.dumps(parameters),
            created_by=user_id
        )
        db.session.add(operation)
        
        # Create activity record
        activity = ProjectActivity(
            project_id=project_id,
            user_id=user_id,
            action=f"applied_{operation_type}",
            activity_metadata=json.dumps({
                'operation_type': operation_type,
                'dataset_id': current_version.dataset_id,
                'new_version': new_version_number,
                'parameters': parameters
            })
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return {
            'version_id': new_version.id,
            'version_number': new_version_number,
            'file_path': new_file_path,
            'operation_id': operation.id
        }
    
    def _apply_operation_logic(self, df, operation_type, parameters):
        if operation_type == 'clean_data' and self.data_cleaner:
            return self.data_cleaner.clean_data(df, parameters)
        elif operation_type == 'augment_data' and self.data_augmenter:
            return self.data_augmenter.smart_augmentation(df.to_dict('records'))['data']
        elif operation_type == 'fill_missing':
            method = parameters.get('method', 'mean')
            columns = parameters.get('columns', [])
            return self._fill_missing_values(df, method, columns)
        elif operation_type == 'remove_outliers':
            method = parameters.get('method', 'iqr')
            columns = parameters.get('columns', [])
            return self._remove_outliers(df, method, columns)
        else:
            # Fallback to basic processing
            return self._basic_processing(df, operation_type, parameters)
    
    def _fill_missing_values(self, df, method, columns):
        df_copy = df.copy()
        if not columns:
            columns = df_copy.select_dtypes(include=['number']).columns
        
        for col in columns:
            if col in df_copy.columns:
                if method == 'mean':
                    df_copy[col].fillna(df_copy[col].mean(), inplace=True)
                elif method == 'median':
                    df_copy[col].fillna(df_copy[col].median(), inplace=True)
                elif method == 'mode':
                    df_copy[col].fillna(df_copy[col].mode()[0], inplace=True)
        
        return df_copy
    
    def _remove_outliers(self, df, method, columns):
        df_copy = df.copy()
        if not columns:
            columns = df_copy.select_dtypes(include=['number']).columns
        
        for col in columns:
            if col in df_copy.columns and method == 'iqr':
                Q1 = df_copy[col].quantile(0.25)
                Q3 = df_copy[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df_copy = df_copy[(df_copy[col] >= lower_bound) & (df_copy[col] <= upper_bound)]
        
        return df_copy
    
    def _get_next_version_number(self, dataset_id, project_id):
        latest_version = DatasetVersion.query.filter_by(
            dataset_id=dataset_id, 
            project_id=project_id
        ).order_by(DatasetVersion.version_number.desc()).first()
        
        return (latest_version.version_number + 1) if latest_version else 1
    
    def _basic_processing(self, df, operation_type, parameters):
        """Basic fallback processing when advanced services aren't available"""
        if operation_type == 'clean_data':
            # Basic cleaning
            df_clean = df.copy()
            df_clean = df_clean.dropna(how='all')  # Remove empty rows
            df_clean = df_clean.drop_duplicates()  # Remove duplicates
            return df_clean
        elif operation_type == 'augment_data':
            # Basic augmentation - just return original data
            return df.copy()
        else:
            return df.copy()