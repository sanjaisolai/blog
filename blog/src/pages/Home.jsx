import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard.jsx';
import BlogModal from '../components/BlogModal.jsx';
import InfiniteScroll from 'react-infinite-scroll-component';

function Home() {
  console.log('Component rendered');

  const batch = 3;
  const [blogs, setBlogs] = useState({});
  const [visibleBlogs, setVisibleBlogs] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const storedBlogs = JSON.parse(localStorage.getItem('blogs')) || {};
    setBlogs(storedBlogs);
  }, []);

  useEffect(() => {
    const entries = Object.entries(blogs);
    setVisibleBlogs(entries.slice(0, batch));
    setHasMore(entries.length > batch);
  }, [blogs]);

  const loadMore = () => {
    setTimeout(() => {
      const entries = Object.entries(blogs);
      const currentLength = visibleBlogs.length;
      const nextBatch = entries.slice(currentLength, currentLength + batch);
      setVisibleBlogs(prev => [...prev, ...nextBatch]);
      if(entries.length <= currentLength + batch) {
        setHasMore(false);
      }
    }, 500); // simulate delay for the api calls(did it because the fetching happens too fast so the loading text was flickering)
  };

  const handleCreate = (newBlog) => {
    setBlogs(prev => {
      const updatedBlogs = { ...newBlog, ...prev };
      localStorage.setItem('blogs', JSON.stringify(updatedBlogs));
      return updatedBlogs;
    });
  };

  return (
    <>
      <div className="flex justify-center bg-gray-900 sticky top-0 z-50">
        <h1 className="m-5 font-bold text-3xl text-white">Blogs</h1>
        <div className="flex justify-end m-5">
          <BlogModal onCreate={handleCreate} />
        </div>
      </div>

      <InfiniteScroll
        dataLength={visibleBlogs.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center m-4">
            <h4 className="text-center text-gray-500">Loading more blogs...</h4>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 mt-4">
          {visibleBlogs.map(([id, blog]) => (
            <BlogCard key={id} blog={blog} id={id} />
          ))}
        </div>
      </InfiniteScroll>
    </>
  );
}

export default Home;
