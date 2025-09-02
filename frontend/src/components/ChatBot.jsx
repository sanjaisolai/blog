import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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
  const [streamingMessageId, setStreamingMessageId] = useState(null)
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
      // Add an empty bot message that will be streamed into
      const botMessageId = Date.now().toString()
      setMessages(prev => [...prev, { 
        id: botMessageId,
        role: "bot", 
        text: "" // Start with empty text
      }])
      setStreamingMessageId(botMessageId)

      // Use fetch API for better streaming support
      const response = await fetch("http://localhost:8000/bot_call_stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_request: userMessage,
          previous_context: messages
        })
      })
      console.log(response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Create a reader to process the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      // Process the stream chunks
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        // Decode the chunk and split by newlines
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())
        
        // Process each line as a separate JSON object
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.error) {
              // Handle error
              console.error("Stream error:", data.error)
              continue
            }
            
            if (data.chunk) {
              // Update the streaming message with new content
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, text: msg.text + data.chunk } 
                    : msg
                )
              )
            }
          } catch (e) {
            console.error("Error parsing chunk:", e)
          }
        }
      }
    } catch (error) {
      console.error("Error with streaming:", error)
      // Update with error message if needed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, text: "Sorry, I encountered an error. Please try again later." } 
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                  {msg.id === streamingMessageId && (
                    <span className="inline-block w-1 h-4 ml-1 bg-black animate-pulse" />
                  )}
                </div>
              ))}
              
              {isLoading && !streamingMessageId && (
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
