from datetime import datetime
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
import csv
from io import StringIO

from models import ChargingSession, get_db

router = APIRouter()

UNLOCK_PHRASE = os.getenv("UNLOCK_PHRASE", "")
SESSION_COOKIE_NAME = "chargerecorder_session"


class UnlockRequest(BaseModel):
    phrase: str


class SessionRequest(BaseModel):
    percentage: int
    type: str  # "start" or "end"


def verify_session(session_cookie: Optional[str] = Cookie(None)) -> bool:
    if not UNLOCK_PHRASE:
        return True  # No auth required if no phrase set
    if not session_cookie:
        return False
    return session_cookie == UNLOCK_PHRASE


def require_auth(session_cookie: Optional[str] = Cookie(None)):
    if not verify_session(session_cookie):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )


@router.post("/api/unlock")
async def unlock(request: UnlockRequest, response: Response):
    if not UNLOCK_PHRASE:
        return {"success": True, "message": "No passphrase configured"}

    if request.phrase == UNLOCK_PHRASE:
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=UNLOCK_PHRASE,
            httponly=True,
            max_age=86400,  # 24 hours
            samesite="lax"
        )
        return {"success": True, "message": "Unlocked"}
    return {"success": False, "message": "Incorrect passphrase"}


@router.get("/api/status")
async def get_status(
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    # Find most recent open session
    open_session = db.query(ChargingSession).filter(
        ChargingSession.end_percentage.is_(None)
    ).order_by(ChargingSession.start_time.desc()).first()

    if open_session:
        return {
            "status": "charging",
            "start_percentage": open_session.start_percentage,
            "start_time": open_session.start_time.isoformat()
        }
    return {"status": "idle"}


@router.get("/api/sessions")
async def get_sessions(
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    sessions = db.query(ChargingSession).order_by(
        ChargingSession.start_time.desc()
    ).all()

    return {
        "sessions": [
            {
                "id": s.id,
                "start_percentage": s.start_percentage,
                "start_time": s.start_time.isoformat(),
                "end_percentage": s.end_percentage,
                "end_time": s.end_time.isoformat() if s.end_time else None
            }
            for s in sessions
        ]
    }


@router.post("/api/sessions")
async def create_session(
    request: SessionRequest,
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    if request.percentage < 0 or request.percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Percentage must be between 0 and 100"
        )

    now = datetime.now()

    if request.type == "start":
        session = ChargingSession(
            start_percentage=request.percentage,
            start_time=now
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return {
            "message": f"Recorded {request.percentage}% as start charge",
            "session": {
                "id": session.id,
                "start_percentage": session.start_percentage,
                "start_time": session.start_time.isoformat()
            }
        }

    elif request.type == "end":
        # Find most recent open session
        open_session = db.query(ChargingSession).filter(
            ChargingSession.end_percentage.is_(None)
        ).order_by(ChargingSession.start_time.desc()).first()

        if not open_session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active charging session found"
            )

        open_session.end_percentage = request.percentage
        open_session.end_time = now
        db.commit()
        return {
            "message": f"Recorded {request.percentage}% as end charge",
            "session": {
                "id": open_session.id,
                "start_percentage": open_session.start_percentage,
                "start_time": open_session.start_time.isoformat(),
                "end_percentage": open_session.end_percentage,
                "end_time": open_session.end_time.isoformat()
            }
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 'start' or 'end'"
        )


@router.get("/api/sessions/csv")
async def export_csv(
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    sessions = db.query(ChargingSession).order_by(
        ChargingSession.start_time.asc()
    ).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["start_percentage", "start_datetime", "end_percentage", "end_datetime"])

    for s in sessions:
        writer.writerow([
            s.start_percentage,
            s.start_time.isoformat(),
            s.end_percentage if s.end_percentage else "",
            s.end_time.isoformat() if s.end_time else ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=charging_sessions.csv"
        }
    )


@router.delete("/api/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    session = db.query(ChargingSession).filter(
        ChargingSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}


@router.delete("/api/sessions")
async def delete_all_sessions(
    db: Session = Depends(get_db),
    session_cookie: Optional[str] = Cookie(None)
):
    require_auth(session_cookie)

    db.query(ChargingSession).delete()
    db.commit()
    return {"message": "All sessions deleted"}


@router.get("/health")
async def health_check():
    return {"status": "ok"}
