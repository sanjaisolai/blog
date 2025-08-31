import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import axios from 'axios'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) 
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    
    try {
      // Send the current request and previous context to the API
      const response = await axios.post("http://localhost:8000/bot_call", {
        current_request: userMessage,
        previous_context: messages // All previous messages
      })
      
      // Add bot response
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: response.data.response 
      }])
    } catch (error) {
      console.error("Error calling bot API:", error)
      // Add error message
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "Sorry, I encountered an error. Please try again later." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key for sending (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
        <DialogContent className="sm:max-w-md flex flex-col h-[500px] max-h-[80vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Chat with Bloggy 🤖</DialogTitle>
          </DialogHeader>

          {/* Chat messages - Fixed ScrollArea */}
          <ScrollArea className="flex-1 w-full overflow-y-auto">
            <div className="space-y-4 p-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Ask me anything about our blog posts!
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg break-words ${
                    msg.role === "user"
                      ? "bg-black text-white ml-auto max-w-[80%]"
                      : "bg-gray-200 text-black max-w-[80%]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              
              {isLoading && (
                <div className="bg-gray-200 text-black p-3 rounded-lg max-w-[80%] flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="flex items-center gap-2 mt-2 p-4 pt-2 border-t flex-shrink-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about blog content..."
              className="resize-none flex-1"
              rows={2}
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              className="h-10 w-10 rounded-full p-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
