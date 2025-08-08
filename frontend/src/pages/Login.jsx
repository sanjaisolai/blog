import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRef } from "react"
const Login=()=>{
    const emailref=useRef()
    const passref=useRef()
    const handleSubmit = (e) => {
        e.preventDefault();
        const email = emailref.current.value;
        const password = passref.current.value;
        console.log("Email:", email);
        console.log("Password:", password);
    }
    return (
        <>
            <div className="flex justify-center bg-gray-300 sticky top-0 z-50">
                <h1 className="m-5 font-bold mr-[5vw] text-3xl text-black">Bloggy</h1>
            </div>
            <div className="flex justify-center items-center mt-[10vh]">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Login to your account</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
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
                                <a
                                href="#"
                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Input id="password" ref={passref} type="password" required />
                            </div>
                        </div>
                    </CardContent>
                    <form onSubmit={handleSubmit}>
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                            <Button variant="outline" className="w-full">
                                Sign Up
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    )
}

export default Login;