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
import { useRef,useState } from "react"
import axios from "axios";
import { useNavigate } from "react-router-dom"
const Signup=()=>{
    const nameRef=useRef()
    const emailRef = useRef();
    const passwordRef = useRef();
    const navigate = useNavigate();
    const [emailExists, setEmailExists] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = nameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const data = {
            name: name,
            email: email,
            password: password,
        };
        try {
            const response = await axios.post("http://localhost:8000/signup", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.data === "done") {
                navigate("/login");
            }
        } catch (error) {
            if (error.response && error.response.data.detail === "Email already exists") {
                setEmailExists(true);
            }
            console.error("Signup failed", error);
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
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>
                            Enter your Details Below
                            {emailExists && (
                                <p className="text-red-500 text-sm mt-2">
                                    Email already exists
                                </p>
                            )}
                        </CardDescription>
    
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Full Name</Label>
                                <Input
                                    id="Name"
                                    type="text"
                                    ref={nameRef}
                                    placeholder="Name"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    ref={emailRef}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="">
                                    <Label htmlFor="password">Password</Label>

                                </div>
                                <Input id="password" ref={passwordRef} type="password" required />
                            </div>
                        </div>
                    </CardContent>
                    
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full">
                                Sign Up
                            </Button>
                        </CardFooter>
                    
                </Card>
                </form>
            </div>
        </>
    )
}

export default Signup;