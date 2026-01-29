from fastapi import HTTPException
from models import SignupModel, LoginModel
from utils import read_users, write_users

def signup_user(data: SignupModel):
    users = read_users()

    for u in users:
        if u.get("email") == data.email:
            raise HTTPException(status_code=400, detail="Email already exists")

    new_user = {
        "name": data.name,
        "email": data.email,
        "password": data.password
    }

    users.append(new_user)
    write_users(users)

    return {"message": "Signup successful"}

def login_user(data: LoginModel):
    users = read_users()

    for u in users:
        if u.get("email") == data.email and u.get("password") == data.password:
            return {
                "message": "Login successful",
                "user": {
                    "name": u.get("name"),
                    "email": u.get("email")
                }
            }

    raise HTTPException(status_code=401, detail="Invalid credentials")
