import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
function BlogModal({ onCreate }) {
  const titleRef = useRef();
  const contentRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBlog = {
      [uuidv4()]: {
        title: titleRef.current.value,
        content: contentRef.current.value,
        createdAt: new Date().toISOString(),
      },
    };
    onCreate(newBlog);
    e.target.reset(); 
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white">+ Add Blog</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Blog</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" ref={titleRef} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              ref={contentRef}
              required
              className="min-h-[200px] max-h-[400px] overflow-y-auto"
            />
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">Post Blog</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>

    </Dialog>
  );
}

export default BlogModal;
