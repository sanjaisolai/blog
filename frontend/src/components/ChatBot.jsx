import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send } from "lucide-react"

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([])
  const [input, setInput] = useState("")

  const sendMessage = () => {
    if (!input.trim()) return

    // Add user message
    setMessages([...messages, { role: "user", text: input }])

    // Simulate bot reply
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", text: "This is a bot reply." }])
    }, 800)

    setInput("")
  }

  return (
    <div>
      {/* Floating Chat Icon */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md flex flex-col h-[500px]">
          <DialogHeader>
            <DialogTitle>Chat with us 🤖</DialogTitle>
          </DialogHeader>

          {/* Chat messages area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-black text-white ml-auto"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="flex items-center gap-2 mt-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="resize-none flex-1"
              rows={2}
            />
            <Button onClick={sendMessage} className="h-10 w-10 rounded-full p-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
