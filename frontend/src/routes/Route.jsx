import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import BlogDetail from "../pages/BlogDetail";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import MyBlog from "../pages/MyBlog";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/post/:id" element={<BlogDetail />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/myblog" element={<MyBlog />} />
    </Routes>
  );
}

export default AppRoutes;
