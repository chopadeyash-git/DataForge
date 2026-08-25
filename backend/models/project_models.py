from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Organization(db.Model):
    __tablename__ = 'organizations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    projects = db.relationship('Project', backref='organization', lazy=True)

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    members = db.relationship('ProjectMember', backref='project', lazy=True)
    dataset_versions = db.relationship('DatasetVersion', backref='project', lazy=True)
    operations = db.relationship('Operation', backref='project', lazy=True)
    activities = db.relationship('ProjectActivity', backref='project', lazy=True)

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.Enum('admin', 'editor', 'viewer', name='member_roles'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('project_id', 'user_id'),)

class DatasetVersion(db.Model):
    __tablename__ = 'dataset_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    dataset_id = db.Column(db.Integer, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    parent_version_id = db.Column(db.Integer, db.ForeignKey('dataset_versions.id'), nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    parent_version = db.relationship('DatasetVersion', remote_side=[id], backref='child_versions')
    operations = db.relationship('Operation', backref='dataset_version', lazy=True)

class Operation(db.Model):
    __tablename__ = 'operations'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    dataset_version_id = db.Column(db.Integer, db.ForeignKey('dataset_versions.id'), nullable=False)
    operation_type = db.Column(db.String(100), nullable=False)
    parameters = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_parameters(self):
        return json.loads(self.parameters)
    
    def set_parameters(self, params):
        self.parameters = json.dumps(params)

class ProjectActivity(db.Model):
    __tablename__ = 'project_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    activity_metadata = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_metadata(self):
        return json.loads(self.activity_metadata) if self.activity_metadata else {}
    
    def set_metadata(self, meta):
        self.activity_metadata = json.dumps(meta) if meta else None