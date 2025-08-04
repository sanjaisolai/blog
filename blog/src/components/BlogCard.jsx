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

const BlogCard = React.memo(function BlogCard({ blog, id }) {
  const formattedDate = useMemo(() => {
    return new Date(blog.createdAt).toLocaleString();
  }, [blog.createdAt]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{blog.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            {formattedDate}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Link to={`/post/${id}`}>
          <Button type="button" className="w-full">
            full post
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
});

export default BlogCard;
