import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRef, useState } from "react"
import axios from "axios"
import {Link,useNavigate} from "react-router-dom"
const Login=()=>{
    const emailref=useRef()
    const passref=useRef()
    const navigate=useNavigate()
    const [loginfailed, setLoginFailed] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = emailref.current.value;
        const password = passref.current.value;
        const data={
            email:email,
            password:password
        }
        try{
            const response = await axios.post("http://localhost:8000/login",data,{
                headers:{
                    "Content-Type":"application/json"
                }
            })
            if(response.status===200){
                localStorage.setItem("token", response.data.access_token);
                localStorage.setItem("user_id", response.data.user_id);
                navigate("/")
            }
        }catch(e){
            if (e.response && e.response.data && e.response.data.detail) {
                setLoginFailed(true);
            } else {
                console.log("Error logging in", e);
            }
        }
        
    }
    return (
        <>
            <div className="flex justify-center bg-gray-300 sticky top-0 z-50">
                <h1 className="m-5 font-bold mr-[5vw] text-3xl text-black">Bloggy</h1>
            </div>
            <div className="flex justify-center items-center mt-[10vh]">
                <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Login to your account</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
                            {loginfailed && (
                                <p className="text-red-500 text-sm mt-2">
                                    Invalid email or password
                                </p>
                            )}
                        </CardDescription>
    
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                ref={emailref}
                                placeholder="m@example.com"
                                required
                            />
                            </div>
                            <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input id="password" ref={passref} type="password" required />
                            </div>
                        </div>
                    </CardContent>
                    
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                            <Link to="/signup" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Sign Up
                                </Button>
                            </Link>
                        </CardFooter>
                    
                </Card>
                </form>
            </div>
        </>
    )
}

export default Login;