import { useRef, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function BlogModal({ onCreate, falseContent }) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef();
  const contentRef = useRef();
  const fileRef = useRef();
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = titleRef.current.value.trim();
    const content = contentRef.current.value.trim();

    if (!title || !content) {
      setError("Title and Content cannot be blank.");
      return;
    }
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      setError("Content should have at least 50 words.");
      return;
    }

    setError("");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("createdAt", new Date().toLocaleDateString());
    formData.append("createdTime", new Date().toLocaleTimeString());
    if (fileRef.current?.files?.[0]) {
      formData.append("image", fileRef.current.files[0]);
    }

    try {
      await onCreate(formData);
      setOpen(false);
      if (titleRef.current) titleRef.current.value = "";
      if (contentRef.current) contentRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError("Failed to create blog.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='cursor-pointer' onClick={() => setError("")}>+ Add Blog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Blog</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" ref={titleRef} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" ref={contentRef} className="h-56 overflow-y-auto resize-none" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image">Image (optional)</Label>
            <Input id="image" type="file" accept="image/*" ref={fileRef} />
            <p className="text-xs text-gray-500">Max {5}MB. JPG, PNG, GIF, WEBP.</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {falseContent && <p className="text-red-500 text-sm">Inappropriate content detected, Check these following: 1. Title and content must be relevant to each other. 2. Title and content must not be gibberish or meaningless text. 3. Content should not contain harmful or offensive material.  </p>}

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Post Blog</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BlogModal;
