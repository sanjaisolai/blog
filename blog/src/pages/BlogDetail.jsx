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
    <div className="">/* Add your styling here */
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      <p className="text-gray-600 mb-2">{new Date(blog.createdAt).toLocaleString()}</p>
      <p className="whitespace-pre-line">{blog.content}</p>
    </div>
  );
}
export default BlogDetail;
