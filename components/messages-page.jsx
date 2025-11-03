import { MessagePanel } from './message-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Activity } from 'lucide-react'

export function MessagesPage({ messages, onClearMessages, connectionStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
          Wallet ↔ dApp Communication
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Monitor real-time communication between your wallet and dApp. All FCL operations and wallet responses are logged here.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{connectionStats.requests}</p>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{connectionStats.responses}</p>
                <p className="text-xs text-muted-foreground">Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{connectionStats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Panel */}
      <div className="h-[700px]">
        <MessagePanel 
          messages={messages} 
          onClearMessages={onClearMessages}
        />
      </div>
    </div>
  )
}