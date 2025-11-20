from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import db

router = APIRouter(prefix="/patient", tags=["Patient"])

class Patient(BaseModel):
    name:str
    age:str
    gender:str
    phone:str
    email:str
    notes:str

@router.post("/add-patient")
async def addPatient(data: Patient):
    result = await db["Patients"].insert_one(data.model_dump())
    return {"message":"Patient added successfully"}