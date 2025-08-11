import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Link } from 'react-router-dom';
import axios from 'axios';
const BlogCard = React.memo(function BlogCard({ blog, id, del }) {
  const imageSrc = useMemo(() => {
    if (!blog.imageUrl) return null;
    return `http://localhost:8000${blog.imageUrl}`;
  }, [blog.imageUrl]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/deleteblog/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      window.location.reload(); 
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={blog.title || "Blog image"}
            className="w-full h-48 object-cover rounded-md"
            loading="lazy"
          />
        )}
        <CardTitle className="mt-2">{blog.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            {blog.createdAt && (<p>Created At: {blog.createdAt}</p>)}
            {blog.createdTime && (<p>Created Time: {blog.createdTime}</p>)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Link to={`/post/${id}`} className='w-full m-2'>
          <Button type="button" className="w-full ">
            full post
          </Button>
        </Link>
        {del && (
          <Button
            type="button"
            className="w-full m-2 bg-red-500"
            onClick={() => handleDelete(id)}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});

export default BlogCard;
