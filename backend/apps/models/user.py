"""
User Model — Frozen PostgreSQL schema contract mapping (table: users)
Track A (Database Layer) — Stage 1
"""

import uuid
from sqlalchemy import Column, String, DateTime, text, func, UUID
from apps.core.database.engine import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(120))
    role = Column(String(20), nullable=False, default='viewer', server_default=text("'viewer'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __init__(self, **kwargs):
        # Map Pydantic/dict 'id' to 'user_id' for backwards compatibility
        if 'id' in kwargs and 'user_id' not in kwargs:
            try:
                kwargs['user_id'] = uuid.UUID(str(kwargs.pop('id')))
            except (ValueError, TypeError):
                kwargs['user_id'] = kwargs.pop('id')
        
        # Ensure user_id is a UUID if passed as string
        if 'user_id' in kwargs and isinstance(kwargs['user_id'], str):
            try:
                kwargs['user_id'] = uuid.UUID(kwargs['user_id'])
            except (ValueError, TypeError):
                pass
                
        super().__init__(**kwargs)

    @property
    def id(self):
        return self.user_id

    @id.setter
    def id(self, value):
        self.user_id = value
