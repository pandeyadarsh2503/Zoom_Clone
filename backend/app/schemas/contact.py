from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    title: Optional[str] = Field(default=None, max_length=120)


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    title: Optional[str] = None
    status: str  # online | busy | offline — live-overlaid by the API
    accent: Optional[str] = None


class ContactListOut(BaseModel):
    items: list[ContactOut]
    total: int
