from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import os, uuid, datetime, json, asyncio
import pytz
from db import db_insert, db_display, db_update
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from verify import verify_password, get_password_hash, create_access_token
from jose import JWTError, jwt
from dotenv import load_dotenv
import uvicorn
import rag_pipeline
import bot
from typing import Dict
# Add this import at the top with other imports
from fastapi.responses import JSONResponse, StreamingResponse
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user details from database
        query = "SELECT id, name, email FROM consumer.userdetails WHERE email=%s"
        user = db_display(query, (email,))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id, name, email = user[0]
        return {"user_id": user_id, "name": name, "email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class Item(BaseModel):
    name:str
    email:str
    password:str

class LoginItem(BaseModel):
    email:str
    password:str    

class BlogItem(BaseModel):
    title: str
    content: str
    createdAt: str
    createdTime: str

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
BASE_DIR = os.path.dirname(__file__)
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
UPLOAD_DIR = os.path.join(MEDIA_ROOT, "uploads")  # Add this line
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Change this line
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_UPLOAD_MB = 5

@app.post("/signup")
def signup(item: Item):
    name = item.name
    email = item.email
    password = get_password_hash(item.password)
    id = str(uuid.uuid4())
    
    query = "SELECT id FROM consumer.userdetails WHERE email=%s"
    user = db_display(query, (email,))
    if user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    query = "insert into consumer.userdetails values(%s,%s,%s,%s)"
    values = (id, name, email, password)
    db_insert(query, values)
    return "done"

@app.post("/login")
def login(item: LoginItem):
    email = item.email
    password = item.password
    query = "SELECT id, name, email, password FROM consumer.userdetails WHERE email=%s"
    user = db_display(query, (email,))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    user_id, name, email, hashed_password = user[0]
    if not verify_password(password, hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": email})
    return JSONResponse({"access_token": access_token, "token_type": "bearer", "user_id": user_id, "name": name})

@app.post("/addblog")
def addblog(
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
):
    blog_id = str(uuid.uuid4())
    user_id = current_user["user_id"]
    delete = 0
    if not bot.check_blog_content_langchain(title, content):
        raise HTTPException(status_code=410, detail="inappropriate content detected")
    image_url = None
    if image and image.filename:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are allowed.")
        _, ext = os.path.splitext(image.filename)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported image format.")

        filename = f"{blog_id}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)  # Change this line to use UPLOAD_DIR
        bytes_written = 0
        max_bytes = MAX_UPLOAD_MB * 1024 * 1024
        with open(filepath, "wb") as f:
            while True:
                chunk = image.file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    try:
                        f.close()
                        os.remove(filepath)
                    except Exception:
                        pass
                    raise HTTPException(status_code=413, detail=f"Image too large (>{MAX_UPLOAD_MB}MB).")
                f.write(chunk)

        image_url = f"/media/uploads/{filename}"  # Change this line to include uploads/

    # Set timestamps on server side with IST timezone
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(ist)
    created_at = now.date().isoformat()  # "2025-08-29"
    created_time = now.time().replace(microsecond=0).isoformat()  # "14:35:42" (clean IST time)
    username=current_user["name"]
    rag_pipeline.add_blog_to_pinecone(blog_id, f"{title}\nby {username}\n{content}")
    query = """
        INSERT INTO blog.blogdetails
            (id, user_id, title, content, "delete", createdat, "time", image_url)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """
    values = (blog_id, user_id, title, content, delete, created_at, created_time, image_url)
    db_insert(query, values)

    return {
        "message": "Blog created successfully",
        "blog_id": blog_id,
        "image_url": image_url,
    }

@app.get("/getblogs")
def get_blogs(page: int = 1, limit: int = 5):
    offset = (page - 1) * limit
    query = """
        SELECT b.id, b.title, b.content, b.createdat as createdAt, u.name, b.time as createdTime, b.image_url
        FROM blog.blogdetails b
        JOIN consumer.userdetails u ON b.user_id = u.id
        WHERE b.delete = 0
        ORDER BY b.time DESC
        LIMIT %s OFFSET %s
    """
    blogs = db_display(query, (limit, offset))
    blog_list = []
    for blog in blogs:
        blog_list.append({
            "id": blog[0],
            "title": blog[1],
            "content": blog[2],
            "createdAt": blog[3],
            "author": blog[4],
            "createdTime": blog[5],
            "imageUrl": blog[6],
        })
    return {"blogs": blog_list}

@app.get("/getblog/{id}")
def getblog(id: str):
    query = """
        SELECT b.id, b.title, b.content, b.createdat as createdAt, b.time as createdTime, u.name, b.image_url
        FROM blog.blogdetails b
        JOIN consumer.userdetails u ON b.user_id = u.id
        WHERE b.id = %s AND b.delete = 0
    """
    blog = db_display(query, (id,))
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    row = blog[0]
    return {
        "id": row[0],
        "title": row[1],
        "content": row[2],
        "createdAt": row[3],
        "createdTime": row[4],
        "author": row[5],
        "imageUrl": row[6],
    }

@app.get("/myblogs")
def my_blogs(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    query = "SELECT b.id, b.title, b.content, b.createdat as createdAt, b.time as createdTime, b.image_url FROM blog.blogdetails b WHERE b.user_id = %s AND b.delete = 0"
    blogs = db_display(query, (user_id,))
    blog_list = []
    for blog in blogs:
        blog_list.append({
            "id": blog[0],
            "title": blog[1],
            "content": blog[2],
            "createdAt": blog[3],
            "createdTime": blog[4],
            "imageUrl": blog[5]
        })
    return {"blogs": blog_list}

@app.delete("/deleteblog/{id}")
def delete_blog(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    query = "UPDATE blog.blogdetails SET delete = 1 WHERE id = %s AND user_id = %s"
    db_update(query, (id, user_id))
    return {"message": "Blog deleted successfully"}

@app.post("/bot_call")
async def bot_call(request: Request):
    try:
        # Parse incoming JSON
        body = await request.json()
        current_request = body.get("current_request", "")
        previous_context = body.get("previous_context", [])
        
        # Validate request
        if not current_request:
            raise HTTPException(status_code=400, detail="Missing current_request")
            
        # Convert message history to conversation format
        conversation_history = ""
        if previous_context:
            for msg in previous_context:
                prefix = "User: " if msg["role"] == "user" else "Bot: "
                conversation_history += f"{prefix}{msg['text']}\n"
        
        # Call RAG pipeline
        response = rag_pipeline.query_rag(current_request, conversation_history)
        
        # # Also index the question and answer to improve future responses
        # combined_text = f"Question: {current_request}\nAnswer: {response}"
        # try:
        #     rag_pipeline.add_blog_to_pinecone(f"chat-{uuid.uuid4()}", combined_text)
        # except Exception as e:
        #     print(f"Warning: Failed to index Q&A: {e}")
            
        return {"response": response}
    except Exception as e:
        print(f"Error in bot_call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/bot_call_stream")
async def bot_call_stream(request: Request):
    try:
        # Parse incoming JSON
        body = await request.json()
        current_request = body.get("current_request", "")
        previous_context = body.get("previous_context", [])
        
        # Validate request
        if not current_request:
            raise HTTPException(status_code=400, detail="Missing current_request")
            
        # Convert message history to conversation format
        conversation_history = ""
        if previous_context:
            for msg in previous_context:
                prefix = "User: " if msg["role"] == "user" else "Bot: "
                conversation_history += f"{prefix}{msg['text']}\n"
        
        # Get streaming response
        stream = await rag_pipeline.query_rag_stream(current_request, conversation_history)
        
        # Define a streaming response generator
        async def stream_generator():
            try:
                for chunk in stream:
                    if hasattr(chunk.choices[0], 'delta') and chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        if content:
                            # Send each chunk as a JSON object with a newline delimiter
                            yield json.dumps({"chunk": content}) + "\n"
                            # Add a small delay to prevent overwhelming the client
                            await asyncio.sleep(0.01)
            except Exception as e:
                print(f"Streaming error: {e}")
                yield json.dumps({"error": str(e)}) + "\n"
        
        # Return a streaming response
        return StreamingResponse(
            stream_generator(),
            media_type="application/x-ndjson"  # Newline-delimited JSON
        )
            
    except Exception as e:
        print(f"Error in bot_call_stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Add WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"Client {client_id} disconnected")

    async def send_json(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

# Initialize manager
manager = ConnectionManager()

# Add WebSocket endpoint
@app.websocket("/ws/chat/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    print(f"New WebSocket connection from client {client_id}")
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            print(f"Received message from client {client_id}: {data.get('current_request', '')}")
            
            current_request = data.get("current_request", "")
            previous_context = data.get("previous_context", [])
            
            if not current_request:
                await websocket.send_json({"error": "Missing current_request"})
                continue
                
            # Convert message history to conversation format
            conversation_history = ""
            if previous_context:
                for msg in previous_context:
                    prefix = "User: " if msg["role"] == "user" else "Bot: "
                    conversation_history += f"{prefix}{msg['text']}\n"
            
            # Get streaming response
            print(f"Getting streaming response for: {current_request}")
            stream = await rag_pipeline.query_rag_stream(current_request, conversation_history)
            
            # Stream response over WebSocket
            try:
                chunks_sent = 0
                for chunk in stream:
                    if hasattr(chunk.choices[0], 'delta') and chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        if content:
                            chunks_sent += 1
                            await websocket.send_json({"chunk": content})
                            # Small delay to prevent overwhelming the client
                            await asyncio.sleep(0.01)
                
                # Signal completion
                print(f"Completed streaming response, sent {chunks_sent} chunks")
                await websocket.send_json({"complete": True})
                
            except Exception as e:
                print(f"Streaming error: {e}")
                await websocket.send_json({"error": str(e)})
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: client {client_id}")
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(client_id)


if __name__ == "__main__":
    uvicorn.run("app:app", port=8000, reload=True)