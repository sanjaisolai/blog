import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    const blogs = JSON.parse(localStorage.getItem('blogs')) || [];
    const found = blogs[id];
    if (!found) {
        
      navigate('/');
    } else {
      setBlog(found);
    }
  }, [id]);

  if (!blog) return null;

  return (
    <>
    <div className="flex justify-between items-center p-4 bg-gray-900 sticky top-0 z-50">
      <button
        className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
        onClick={() => navigate('/')} 
      >
        Go Back
      </button>
      <div className='text-center flex-1 pr-[10vw]'>
        <h1 className="text-3xl font-bold mt-4 text-white">{blog.title}</h1>
        <h2 className="text-lg font-semibold text-white">Published on:</h2>
        <h4 className="text-gray-600 mb-2 text-white">{new Date(blog.createdAt).toLocaleString()}</h4>
      </div>
    </div>
    <div className="flex flex-col items-center p-4 max-w-2xl mx-auto">
      <p className="text-lg">{blog.content}</p>
    </div>
    </>
  );
}
export default BlogDetail;
