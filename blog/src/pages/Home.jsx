import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard.jsx';
import BlogModal from '../components/BlogModal.jsx';

function Home() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const storedBlogs = JSON.parse(localStorage.getItem('blogs')) || [];
    setBlogs(storedBlogs);
  }, []);

  const handleCreate = (newBlog) => {
    const updatedBlogs = { ...newBlog, ...blogs }; // Merge new blog
    setBlogs(updatedBlogs);
    localStorage.setItem('blogs', JSON.stringify(updatedBlogs));
  };

  return (
    <>
      <div className='flex justify-center  bg-gray-900'>
        <h1 className="m-5 font-bold text-3xl text-white">Blogs</h1>
        <div className="flex justify-end m-5">
          <BlogModal className="" onCreate={handleCreate} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 mt-4">
        {Object.entries(blogs).map(([id, blog]) => (
          <BlogCard key={id} blog={blog} id={id} />
        ))}
      </div>
    </>
  );
}
export default Home;
