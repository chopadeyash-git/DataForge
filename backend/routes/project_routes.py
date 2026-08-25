from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_models import db, Organization, Project, ProjectMember, DatasetVersion, Operation, ProjectActivity
from services.project_operation_engine import ProjectOperationEngine
import os
import pandas as pd

project_bp = Blueprint('projects', __name__, url_prefix='/api/v2/projects')
operation_engine = ProjectOperationEngine()

@project_bp.route('/create', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Create organization if not exists
    org_name = data.get('organization', 'Default Organization')
    organization = Organization.query.filter_by(name=org_name, created_by=user_id).first()
    if not organization:
        organization = Organization(name=org_name, created_by=user_id)
        db.session.add(organization)
        db.session.flush()
    
    # Create project
    project = Project(
        name=data['name'],
        organization_id=organization.id,
        created_by=user_id
    )
    db.session.add(project)
    db.session.flush()
    
    # Add creator as admin
    member = ProjectMember(
        project_id=project.id,
        user_id=user_id,
        role='admin'
    )
    db.session.add(member)
    
    # Log activity
    activity = ProjectActivity(
        project_id=project.id,
        user_id=user_id,
        action='project_created',
        activity_metadata='{"project_name": "' + data['name'] + '"}'
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({
        'project_id': project.id,
        'name': project.name,
        'organization': organization.name,
        'created_at': project.created_at.isoformat()
    }), 201

@project_bp.route('/add-member', methods=['POST'])
@jwt_required()
def add_member():
    user_id = get_jwt_identity()
    data = request.get_json()
    project_id = data['project_id']
    
    # Verify admin access
    if not operation_engine.verify_user_access(project_id, user_id, 'admin'):
        return jsonify({'error': 'Admin access required'}), 403
    
    # Add member
    member = ProjectMember(
        project_id=project_id,
        user_id=data['user_id'],
        role=data['role']
    )
    db.session.add(member)
    
    # Log activity
    activity = ProjectActivity(
        project_id=project_id,
        user_id=user_id,
        action='member_added',
        activity_metadata=f'{{"added_user": {data["user_id"]}, "role": "{data["role"]}"}}'
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({'message': 'Member added successfully'}), 201

@project_bp.route('/<int:project_id>/datasets/add', methods=['POST'])
@jwt_required()
def add_dataset(project_id):
    user_id = get_jwt_identity()
    
    # Verify editor access
    if not operation_engine.verify_user_access(project_id, user_id, 'editor'):
        return jsonify({'error': 'Editor access required'}), 403
    
    file = request.files['file']
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    
    # Generate dataset ID
    dataset_id = len(DatasetVersion.query.filter_by(project_id=project_id).all()) + 1
    
    # Save file
    file_path = operation_engine.get_storage_path(project_id, dataset_id, 1)
    operation_engine.ensure_storage_directory(project_id, dataset_id)
    file.save(file_path)
    
    # Create initial version
    version = DatasetVersion(
        dataset_id=dataset_id,
        project_id=project_id,
        version_number=1,
        parent_version_id=None,
        file_path=file_path,
        created_by=user_id
    )
    db.session.add(version)
    
    # Log activity
    activity = ProjectActivity(
        project_id=project_id,
        user_id=user_id,
        action='dataset_added',
        activity_metadata=f'{{"dataset_id": {dataset_id}, "filename": "{file.filename}"}}'
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({
        'dataset_id': dataset_id,
        'version_id': version.id,
        'version_number': 1,
        'file_path': file_path
    }), 201

@project_bp.route('/<int:project_id>/operations/apply', methods=['POST'])
@jwt_required()
def apply_operation(project_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        result = operation_engine.apply_operation(
            project_id=project_id,
            dataset_version_id=data['dataset_version_id'],
            operation_type=data['operation_type'],
            parameters=data['parameters'],
            user_id=user_id
        )
        return jsonify(result), 200
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@project_bp.route('/<int:project_id>/datasets', methods=['GET'])
@jwt_required()
def get_datasets(project_id):
    user_id = get_jwt_identity()
    
    # Verify access
    if not operation_engine.verify_user_access(project_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    versions = DatasetVersion.query.filter_by(project_id=project_id).all()
    datasets = {}
    
    for version in versions:
        if version.dataset_id not in datasets:
            datasets[version.dataset_id] = []
        datasets[version.dataset_id].append({
            'version_id': version.id,
            'version_number': version.version_number,
            'created_by': version.created_by,
            'created_at': version.created_at.isoformat(),
            'parent_version_id': version.parent_version_id
        })
    
    return jsonify(datasets), 200

@project_bp.route('/<int:project_id>/operations', methods=['GET'])
@jwt_required()
def get_operations(project_id):
    user_id = get_jwt_identity()
    
    # Verify access
    if not operation_engine.verify_user_access(project_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    operations = Operation.query.filter_by(project_id=project_id).order_by(Operation.created_at.desc()).all()
    
    result = []
    for op in operations:
        result.append({
            'id': op.id,
            'operation_type': op.operation_type,
            'parameters': op.get_parameters(),
            'created_by': op.created_by,
            'created_at': op.created_at.isoformat(),
            'dataset_version_id': op.dataset_version_id
        })
    
    return jsonify(result), 200

@project_bp.route('/<int:project_id>/versions', methods=['GET'])
@jwt_required()
def get_versions(project_id):
    user_id = get_jwt_identity()
    
    # Verify access
    if not operation_engine.verify_user_access(project_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    versions = DatasetVersion.query.filter_by(project_id=project_id).order_by(DatasetVersion.created_at.desc()).all()
    
    result = []
    for version in versions:
        result.append({
            'id': version.id,
            'dataset_id': version.dataset_id,
            'version_number': version.version_number,
            'parent_version_id': version.parent_version_id,
            'created_by': version.created_by,
            'created_at': version.created_at.isoformat()
        })
    
    return jsonify(result), 200

@project_bp.route('/<int:project_id>/activity', methods=['GET'])
@jwt_required()
def get_activity(project_id):
    user_id = get_jwt_identity()
    
    # Verify access
    if not operation_engine.verify_user_access(project_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    activities = ProjectActivity.query.filter_by(project_id=project_id).order_by(ProjectActivity.created_at.desc()).all()
    
    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'user_id': activity.user_id,
            'action': activity.action,
            'metadata': activity.get_metadata(),
            'created_at': activity.created_at.isoformat()
        })
    
    return jsonify(result), 200