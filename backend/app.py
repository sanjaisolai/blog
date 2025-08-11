from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
import os, uuid, datetime
from db import db_insert,db_display, db_update
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from verify import verify_password,get_password_hash,create_access_token
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from dotenv import load_dotenv
import uvicorn
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
os.makedirs(MEDIA_ROOT, exist_ok=True)
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


# Remove BlogItem usage for addblog; switch to form-data and file upload
@app.post("/addblog")
def addblog(
    title: str = Form(...),
    content: str = Form(...),
    createdAt: str = Form(...),
    createdTime: str = Form(...),
    image: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
):
    blog_id = str(uuid.uuid4())
    user_id = current_user["user_id"]
    delete = 0

    image_url = None
    if image and image.filename:
        # Content-Type and extension checks
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are allowed.")
        _, ext = os.path.splitext(image.filename)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported image format.")

        # Stream to disk with size guard
        filename = f"{blog_id}{ext}"
        filepath = os.path.join(MEDIA_ROOT, filename)
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

        # Build absolute URL to the uploaded file
        image_url = f"/media/{filename}"

    # Use explicit column list (best practice)
    query = """
        INSERT INTO blog.blogdetails
            (id, user_id, title, content, "delete", createdat, "time", image_url)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """
    values = (blog_id, user_id, title, content, delete, createdAt, createdTime, image_url)
    db_insert(query, values)

    return {
        "message": "Blog created successfully",
        "blog_id": blog_id,
        "image_url": image_url,
    }

# Also include image_url in list/detail endpoints
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

if __name__ == "__main__":
    uvicorn.run("app:app", port=8000, reload=True)