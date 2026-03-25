import os
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    is_admin: bool = False
    
class Token(BaseModel):
    access_token: str
    token_type: str

class TournamentCreate(BaseModel):
    name: str

class ContestCreate(BaseModel):
    name: str
    team1: str
    team2: str
    tournament_id: Optional[str] = None
    start_time: datetime = Field(default_factory=datetime.utcnow)

class Player(BaseModel):
    id: Optional[str] = None
    name: str
    team: str
    role: str # BAT, BOWL, AR, WK
    credits: float = 8.5

class MatchScoreUpdate(BaseModel):
    player_id: str
    runs: int = 0
    fours: int = 0
    sixes: int = 0
    balls_faced: int = 0
    wickets: int = 0
    maidens: int = 0
    overs_bowled: float = 0.0
    catches: int = 0
    stumpings: int = 0
    run_outs: int = 0

class UserTeamSelection(BaseModel):
    contest_id: str
    match_id: str
    player_ids: List[str]
    captain_id: str
    vice_captain_id: str

class ScoringRules:
    @staticmethod
    def calculate_points(stats: MatchScoreUpdate) -> float:
        points = 0.0
        # Batting
        points += stats.runs
        points += stats.fours * 1
        points += stats.sixes * 2
        if stats.runs >= 100:
            points += 20
        elif stats.runs >= 50:
            points += 10
        if stats.runs == 0 and stats.balls_faced > 0:
            # Simple assumption: out for duck if stats update implies duck
            points -= 5
            
        # Bowling
        points += stats.wickets * 25
        if stats.wickets >= 5:
            points += 20
        elif stats.wickets >= 3:
            points += 10
            
        # Fielding
        points += stats.catches * 8
        points += stats.stumpings * 12
        points += stats.run_outs * 12
        
        return points
