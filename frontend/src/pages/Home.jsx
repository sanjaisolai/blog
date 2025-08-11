import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard.jsx';
import BlogModal from '../components/BlogModal.jsx';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom"
import axios from 'axios';

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const limit = 6; // Number of blogs per page

  
  useEffect(() => {
    fetchBlogs(1);
    
    if(localStorage.getItem("token")){
      setHasToken(true);
    }
  }, []);

  
  const fetchBlogs = async (pageNum) => {
    try {
      const response = await axios.get(`http://localhost:8000/getblogs`, {
        params: {
          page: pageNum,
          limit: limit
        },
      });
      
      const newBlogs = response.data.blogs;
      
      
      
      if (pageNum === 1) {
        setHasMore(true);
        setBlogs(newBlogs);
      } else {
        setBlogs(prevBlogs => [...prevBlogs, ...newBlogs]);
      }
      if (!newBlogs || newBlogs.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setHasMore(false);
    }
  };

 
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage);
  };

 
  const handleCreate = async (newBlog) => {
    try {
      const response = await axios.post("http://localhost:8000/addblog", newBlog, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
         fetchBlogs(1);
          setPage(1);

    } catch (e) {
      throw new Error("Failed to create blog: " + e.message);
    }
  };

  return (
    <>
      <div className="flex justify-between bg-gray-300 sticky top-0 z-50">
        <h1 className="m-5 font-bold text-3xl text-black">Bloggy</h1>
        <div className="flex justify-end m-5">
          {hasToken && <BlogModal onCreate={handleCreate} />}
          {!hasToken && (
            <Button className="ml-[2vw]">
              <Link to="/login">Login</Link>
            </Button>
          )}

          {hasToken && (
            <Button className="ml-[2vw]">
              <Link to="/myblog">My Blogs</Link>
            </Button>
          )}
        </div>
      </div>

      <InfiniteScroll
        dataLength={blogs.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center m-4">
            <h4 className="text-center text-gray-500">Loading more blogs...</h4>
          </div>
        }
      >
        <div className="flex items-center gap-4 mt-4 flex-wrap ml-[3vw]">
          {blogs.map(blog => (
            <BlogCard key={blog.id} blog={blog} id={blog.id} del={false} />
          ))}
        </div>
      </InfiniteScroll>
    </>
  );
}

export default Home;
