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
import { MessageCircle, Send, Loader2, WifiOff } from "lucide-react"
// Need to install: npm install uuid
import { v4 as uuidv4 } from 'uuid'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) 
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState(null)
  const streamingMessageIdRef = useRef(null)
  const [wsConnected, setWsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const clientIdRef = useRef(uuidv4())
  const reconnectTimeoutRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // WebSocket connection management
  useEffect(() => {
    if (open && !wsRef.current) {
      connectWebSocket()
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      setWsConnected(false)
      setIsLoading(false)
      setStreamingMessageId(null) 
    }
  }, [open])
  
  const connectWebSocket = () => {
    if (wsRef.current) return;
    
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/chat/${clientIdRef.current}`)
      
      ws.onopen = () => {
        console.log('WebSocket Connected')
        setWsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          // console.log("WebSocket message received:", event.data);
          const data = JSON.parse(event.data)
          if (data.error) {
            console.error("WebSocket error:", data.error)
            setMessages(prev => 
              prev.map(msg => 
                msg.id === streamingMessageIdRef.current
                  ? { ...msg, text: "Sorry, I encountered an error. Please try again." } 
                  : msg
              )
            )
            setIsLoading(false)
            setStreamingMessageId(null)
            return
          }
          
          if (data.chunk) {
            setMessages(prev => {
              const updated = prev.map(msg =>
                msg.id === streamingMessageIdRef.current
                  ? { ...msg, text: msg.text + data.chunk }
                  : msg
              );
              // const botMsg = updated.find(msg => msg.id === streamingMessageId);
              // if (botMsg) {
              //   console.log("Bot message after chunk:", botMsg.text);
              // } else {
              //   console.log("Bot message not found");
              // }
               return updated;
            });
          }
          
          if (data.complete) {
            console.log("Message complete");
            setIsLoading(false)
            setStreamingMessageId(null)
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e, "Raw data:", event.data);
        }
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason)
        wsRef.current = null
        setWsConnected(false)
        
        // Attempt to reconnect after a delay if dialog is open
        if (open) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 2000)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket Error:', error)
        setWsConnected(false)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      setWsConnected(false)
      
      // Attempt to reconnect after a delay
      if (open) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 2000)
      }
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    if (!wsConnected) {
      // Try reconnecting if disconnected
      connectWebSocket()
      alert("Connection lost. Trying to reconnect...")
      return
    }

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    
    // Add an empty bot message that will be streamed into
    const botMessageId = Date.now().toString()
    setMessages(prev => [...prev, { 
      id: botMessageId,
      role: "bot", 
      text: "" // Start with empty text
    }])
    setStreamingMessageId(botMessageId)
    streamingMessageIdRef.current = botMessageId
    // Send message via WebSocket
    wsRef.current.send(JSON.stringify({
      current_request: userMessage,
      previous_context: messages
    }))
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
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen && !wsConnected) {
          connectWebSocket()
        }
      }}>
        <DialogContent className="sm:max-w-md flex flex-col h-[500px] max-h-[80vh]">
          <DialogHeader className="flex-shrink-0 flex items-center justify-between">
            <DialogTitle>Chat with Bloggy 🤖</DialogTitle>
            {!wsConnected && (
              <div className="flex items-center text-red-500 text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Reconnecting...
              </div>
            )}
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
              disabled={isLoading || !wsConnected}
            />
            <Button 
              onClick={sendMessage} 
              className="h-10 w-10 rounded-full p-0"
              disabled={isLoading || !input.trim() || !wsConnected}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
