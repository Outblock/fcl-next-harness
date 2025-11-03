import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { MessageSquare, ArrowRight, ArrowLeft, Trash2, Copy, Filter } from 'lucide-react'
import { cn } from '../lib/utils'

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false })

export function MessagePanel({ messages, onClearMessages }) {
  const messagesEndRef = useRef(null)
  const [showSystemMessages, setShowSystemMessages] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Filter messages based on current filter setting
  const filteredMessages = messages.filter(msg => {
    if (showSystemMessages) return true
    // Only show FCL-related messages (request, response, error from FCL commands)
    return msg.type === 'request' || msg.type === 'response' || msg.type === 'error'
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const formatMessage = (message) => {
    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2)
    }
    return message
  }

  const isJsonMessage = (message) => {
    return typeof message === 'object' && message !== null
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'request':
        return <ArrowRight className="h-4 w-4 text-blue-500" />
      case 'response':
        return <ArrowLeft className="h-4 w-4 text-green-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getMessageColor = (type) => {
    switch (type) {
      case 'request':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20'
      case 'response':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20'
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20'
      default:
        return 'border-l-4 border-gray-500 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-foreground">
              <MessageSquare className="h-5 w-5" />
              Wallet ↔ dApp Messages
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Real-time communication between wallet and dApp
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showSystemMessages ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSystemMessages(!showSystemMessages)}
              className="flex items-center gap-2"
            >
              <Filter className="h-3 w-3" />
              {showSystemMessages ? 'All' : 'FCL Only'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearMessages}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[650px] overflow-y-auto p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Messages will appear here when wallet communicates with dApp</p>
              </div>
            </div>
          ) : (
            <>
              {filteredMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg p-3 transition-all",
                    getMessageColor(msg.type)
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getMessageIcon(msg.type)}
                      <span className="text-sm font-medium">
                        {msg.type === 'request' ? 'dApp → Wallet' : 
                         msg.type === 'response' ? 'Wallet → dApp' : 
                         'System'}
                      </span>
                      {msg.method && (
                        <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                          {msg.method}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(formatMessage(msg.data || msg.message))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                    {isJsonMessage(msg.data || msg.message) ? (
                      <ReactJson
                        src={msg.data || msg.message}
                        theme={{
                          base00: 'transparent',
                          base01: '#ffffff',
                          base02: '#ffffff',
                          base03: '#888888',
                          base04: '#ffffff',
                          base05: '#ffffff',
                          base06: '#66d9ef',
                          base07: '#f92672',
                          base08: '#f92672',
                          base09: '#fd971f',
                          base0A: '#e6db74',
                          base0B: '#a6e22e',
                          base0C: '#66d9ef',
                          base0D: '#66d9ef',
                          base0E: '#ae81ff',
                          base0F: '#fd971f'
                        }}
                        collapsed={false}
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={false}
                        style={{
                          backgroundColor: 'transparent',
                          fontSize: '11px',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                        }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap break-all font-mono">
                        {formatMessage(msg.data || msg.message)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}