import axios from 'axios';
import React, { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard.jsx';
import { useNavigate } from 'react-router-dom';
const MyBlog = () => {
  const [myBlogs, setMyBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyBlogs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/myblogs', {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        setMyBlogs(response.data.blogs);
      } catch (error) {
        console.error("Error fetching my blogs:", error);
      }
    };

    fetchMyBlogs();
  }, []);

  return (
    <>
        <div className="flex justify-between items-center p-4 bg-gray-300 sticky top-0 z-50">
        <button
            className="text-black bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => navigate('/')} 
        >
            Go Back
        </button>
        <div className='text-center flex-1 pr-[10vw]'>
            <h1 className="text-3xl font-bold mt-4 text-black">Your Blogs</h1>
        </div>
        </div>
            <div className="flex flex-wrap ml-[3vw] items-center gap-4 mt-4">

            {myBlogs.map(blog => (
                <BlogCard key={blog.id} blog={blog} id={blog.id} del={true} />
            ))}
            </div>
        </>
    );
};

export default MyBlog;
