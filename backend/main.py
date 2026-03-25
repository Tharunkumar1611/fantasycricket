from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import get_db
from models import UserCreate, UserInDB, Token, ContestCreate, UserTeamSelection, Player, MatchScoreUpdate, ScoringRules, TournamentCreate
from auth import verify_password, get_password_hash, create_access_token, decode_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES
import secrets

app = FastAPI(title="Private IPL Fantasy Cricket")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    email = payload.get("sub")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # map _id to string id
    user["id"] = str(user["_id"])
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permissions required")
    return current_user

@app.get("/users/me")
async def get_users_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "name": current_user.get("name", "User"), "is_admin": current_user.get("is_admin", False)}

@app.post("/register", response_model=dict)
async def register(user: UserCreate, db = Depends(get_db)):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # First user gets admin privileges
    count = await db.users.count_documents({})
    is_admin = count == 0
    
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["is_admin"] = is_admin
    
    result = await db.users.insert_one(user_dict)
    return {"id": str(result.inserted_id), "email": user.email, "is_admin": is_admin}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(
        data={"sub": user["email"]}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

from seed_data import ALL_PLAYERS

@app.post("/tournaments")
async def create_tournament(tournament: TournamentCreate, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    t_dict = tournament.model_dump()
    t_dict["admin_id"] = current_user["id"]
    res = await db.tournaments.insert_one(t_dict)
    return {"id": str(res.inserted_id), "name": tournament.name}

@app.get("/tournaments")
async def get_tournaments(db = Depends(get_db)):
    t = await db.tournaments.find({}).to_list(100)
    for x in t:
        x["id"] = str(x["_id"])
        x.pop("_id", None)
    return t

@app.post("/contests", response_model=dict)
async def create_contest(contest: ContestCreate, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    invite_code = secrets.token_urlsafe(4)[:6].upper()
    contest_dict = contest.model_dump()
    contest_dict["invite_code"] = invite_code
    contest_dict["admin_id"] = current_user["id"]
    contest_dict["match_id"] = f"{contest.team1}_vs_{contest.team2}_{invite_code}"
    # replace start_time native python datetime with ISO to make mongo/json easy if needed, 
    # actually Pydantic parses datetime natively so model_dump outputs datetime obj to mongo
    contest_dict["participants"] = [current_user["id"]]
    
    res = await db.contests.insert_one(contest_dict)
    return {"contest_id": str(res.inserted_id), "invite_code": invite_code, "name": contest.name}

@app.post("/contests/join/{invite_code}")
async def join_contest(invite_code: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contest = await db.contests.find_one({"invite_code": invite_code})
    if not contest:
        raise HTTPException(status_code=404, detail="Invalid invite code")
        
    await db.contests.update_one(
        {"_id": contest["_id"]},
        {"$addToSet": {"participants": current_user["id"]}}
    )
    return {"detail": "Joined contest successfully"}

@app.get("/players/{contest_id}")
async def get_players(contest_id: str, db = Depends(get_db)):
    contest = await db.contests.find_one({"_id": from_string_id(contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
        
    team1 = contest.get("team1")
    team2 = contest.get("team2")
    return [p for p in ALL_PLAYERS if p["team"] in [team1, team2]]

@app.get("/contests/{contest_id}")
async def get_contest(contest_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contest = await db.contests.find_one({"_id": from_string_id(contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    contest["_id"] = str(contest["_id"])
    return contest

@app.get("/contests")
async def get_all_contests(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contests = await db.contests.find({}).to_list(100)
    for c in contests:
        c["_id"] = str(c["_id"])
    return contests

@app.delete("/contests/{contest_id}")
async def delete_contest(contest_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contest = await db.contests.find_one({"_id": from_string_id(contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
        
    if contest["admin_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the contest creator can delete it")
        
    await db.contests.delete_one({"_id": from_string_id(contest_id)})
    await db.user_teams.delete_many({"contest_id": contest_id})
    return {"detail": "Contest securely deleted"}

@app.get("/user/contests")
async def get_user_contests(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contests = await db.contests.find({"participants": current_user["id"]}).to_list(100)
    for c in contests:
        c["_id"] = str(c["_id"])
    return contests

@app.post("/teams")
async def select_team(selection: UserTeamSelection, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if len(selection.player_ids) != 11:
        raise HTTPException(status_code=400, detail="Team must have exactly 11 players")
    if selection.captain_id not in selection.player_ids or selection.vice_captain_id not in selection.player_ids:
        raise HTTPException(status_code=400, detail="C and VC must be in the team")
    if selection.captain_id == selection.vice_captain_id:
        raise HTTPException(status_code=400, detail="C and VC must be different players")
        
    team_dict = selection.model_dump()
    team_dict["user_id"] = current_user["id"]
    team_dict["points"] = 0.0
    
    from bson.objectid import ObjectId
    await db.user_teams.update_one(
        {"user_id": current_user["id"], "contest_id": selection.contest_id, "match_id": selection.match_id},
        {"$set": team_dict},
        upsert=True
    )
    return {"detail": "Team saved successfully"}

@app.get("/contests/{contest_id}/teams/{user_id}")
async def get_user_team(contest_id: str, user_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contest = await db.contests.find_one({"_id": from_string_id(contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    
    from datetime import datetime, timezone
    # Convert naive to UTC aware if necessary, or just naive comparison
    now = datetime.utcnow()
    # Check start time limit
    if "start_time" in contest:
        st = contest["start_time"]
        # Make them both naive for comparison
        if st.tzinfo:
            st = st.replace(tzinfo=None)
        if now < st and user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Match hasn't started! Cannot view other teams yet.")
            
    team = await db.user_teams.find_one({"contest_id": contest_id, "user_id": user_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team["_id"] = str(team["_id"])
    return team

@app.post("/admin/score/{contest_id}")
async def update_score(contest_id: str, score: MatchScoreUpdate, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    contest = await db.contests.find_one({"_id": from_string_id(contest_id)})
    if not contest or contest["admin_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only contest admin can update scores")
        
    pts = ScoringRules.calculate_points(score)
    match_id = contest["match_id"]
    
    # Store match points
    await db.match_scores.update_one(
        {"match_id": match_id, "player_id": score.player_id},
        {"$inc": {"points": pts}},
        upsert=True
    )
    
    # Recalculate leaderboard
    teams = await db.user_teams.find({"contest_id": contest_id, "player_ids": score.player_id}).to_list(1000)
    for t in teams:
        mult = 1.0
        if t["captain_id"] == score.player_id:
            mult = 2.0
        elif t["vice_captain_id"] == score.player_id:
            mult = 1.5
            
        added_pts = pts * mult
        await db.user_teams.update_one({"_id": t["_id"]}, {"$inc": {"points": added_pts}})
        
    return {"detail": f"Updated score. Player earned {pts} points base."}

@app.get("/leaderboard/{contest_id}")
async def get_match_leaderboard(contest_id: str, match_id: str, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    teams = await db.user_teams.find({"contest_id": contest_id, "match_id": match_id}).sort("points", -1).to_list(100)
    results = []
    for t in teams:
        user = await db.users.find_one({"_id": from_string_id(t["user_id"])})
        results.append({
            "user_id": t["user_id"],
            "user": user["name"] if user else "Unknown",
            "points": t.get("points", 0)
        })
    return results

@app.get("/tournaments/{tournament_id}/leaderboard")
async def get_tournament_leaderboard(tournament_id: str, db = Depends(get_db)):
    contests = await db.contests.find({"tournament_id": tournament_id}).to_list(1000)
    contest_ids = [str(c["_id"]) for c in contests]
    teams = await db.user_teams.find({"contest_id": {"$in": contest_ids}}).to_list(10000)
    
    user_pts = {}
    for t in teams:
        uid = t["user_id"]
        user_pts[uid] = user_pts.get(uid, 0.0) + t.get("points", 0.0)
        
    results = []
    for uid, pts in user_pts.items():
        user = await db.users.find_one({"_id": from_string_id(uid)})
        results.append({
            "user_id": uid,
            "user": user["name"] if user else "Unknown",
            "points": pts
        })
    results.sort(key=lambda x: x["points"], reverse=True)
    return results

def from_string_id(id_str):
    from bson.objectid import ObjectId
    try:
        return ObjectId(id_str)
    except:
        return None
