import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def db_insert(query,value):
    connection = psycopg2.connect(
        user=os.getenv("db_username"),
        password=os.getenv("db_password"),
        host=os.getenv("db_host"),
        port=5432,  
        database="postgres"
    )                                                                            
    cursor = connection.cursor()
    cursor.execute(query,value)

    connection.commit()
    print("connected")
    cursor.close()
    connection.close()

def db_display(query,value):
    connection = psycopg2.connect(
        user=os.getenv("db_username"),
        password=os.getenv("db_password"),
        host=os.getenv("db_host"),
        port=5432,  
        database="postgres"
    )                                                                            
    cursor = connection.cursor()
    cursor.execute(query,value)
    var=cursor.fetchall()

    connection.commit()
    print("connected")
    cursor.close()
    connection.close()
    return var

def db_update(query,value):
    connection = psycopg2.connect(
        user=os.getenv("db_username"),
        password=os.getenv("db_password"),
        host=os.getenv("db_host"),
        port=5432,  
        database="postgres"
    )                                                                            
    cursor = connection.cursor()
    cursor.execute(query,value)

    connection.commit()
    print("connected")
    cursor.close()
    connection.close()
