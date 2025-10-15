from fastapi import Depends, HTTPException, status
from jose import jwt
from .jwt_bearer import JWTBearer
from .jwt_handler import SECRET_KEY, ALGORITHM

def require_role(allowed_roles: list[str]):
    def role_dependency(token: str = Depends(JWTBearer())):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_role = payload.get("role")
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Requires one of: {', '.join(allowed_roles)}"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return role_dependency
