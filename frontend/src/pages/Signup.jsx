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
const Signup=()=>{
    return (
        <>
            <div className="flex justify-center bg-gray-300 sticky top-0 z-50">
                <h1 className="m-5 font-bold mr-[5vw] text-3xl text-black">Bloggy</h1>
            </div>
            <div className="flex justify-center items-center mt-[10vh]">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>
                            Enter your Details Below
                        </CardDescription>
    
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Full Name</Label>
                                <Input
                                    id="Name"
                                    type="text"
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
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="">
                                    <Label htmlFor="password">Password</Label>

                                </div>
                                <Input id="password" type="password" required />
                            </div>
                        </div>
                    </CardContent>
                    <form>
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full">
                                Sign Up
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    )
}

export default Signup;