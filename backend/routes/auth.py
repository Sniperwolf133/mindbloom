from fastapi import APIRouter, Depends

from models.auth import AuthResponse, DemoLoginRequest, LoginRequest, SignupRequest, UserProfile
from services.auth_service import demo_login, get_current_user, login_user, signup_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest):
    return signup_user(payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    return login_user(payload)


@router.post("/demo", response_model=AuthResponse)
def login_demo(payload: DemoLoginRequest):
    return demo_login(payload.role)


@router.get("/me", response_model=UserProfile)
def get_me(current_user: UserProfile = Depends(get_current_user)):
    return current_user

