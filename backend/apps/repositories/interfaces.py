"""Repository Interface Definitions for Dependency Injection."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class IAlarmRepository(ABC):
    pass

class IMachineRepository(ABC):
    pass

class IMetadataRepository(ABC):
    pass

class IPermissionRepository(ABC):
    pass

class IRoleRepository(ABC):
    pass

class ITelemetryRepository(ABC):
    pass

class IUserRepository(ABC):
    pass
