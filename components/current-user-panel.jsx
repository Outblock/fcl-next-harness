import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { User, Wallet, Copy, LogOut, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'

export function CurrentUserPanel({ currentUser, config, onLogout, onRefresh }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (address) => {
    if (!address) return 'Not connected'
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
  }

  const getConnectionStatus = () => {
    if (currentUser?.loggedIn) {
      return {
        status: 'Connected',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800'
      }
    }
    return {
      status: 'Disconnected',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  }

  const connectionInfo = getConnectionStatus()

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-foreground">
              <User className="h-5 w-5" />
              Current User
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Connected user details and account information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            {currentUser?.loggedIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-3 w-3" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 h-[600px] overflow-y-auto">
        {/* Connection Status */}
        <div className={cn(
          "p-3 rounded-lg border",
          connectionInfo.bgColor,
          connectionInfo.borderColor
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", 
                currentUser?.loggedIn ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="font-medium">{connectionInfo.status}</span>
            </div>
            {currentUser?.loggedIn && (
              <span className={cn("text-xs", connectionInfo.color)}>
                Active Session
              </span>
            )}
          </div>
        </div>

        {currentUser?.loggedIn ? (
          <div className="space-y-3">
            {/* User Address */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Address</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(currentUser.addr)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-mono text-xs bg-background p-2 rounded border">
                {currentUser.addr}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Short: {formatAddress(currentUser.addr)}
              </div>
            </div>

            {/* Services */}
            {currentUser.services && currentUser.services.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <label className="text-sm font-medium mb-2 block">Connected Services</label>
                <div className="space-y-2">
                  {currentUser.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs p-2 bg-background rounded border">
                      <Wallet className="h-3 w-3" />
                      <span>{service.type || 'Service'}</span>
                      {service.method && (
                        <span className="text-muted-foreground">({service.method})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw User Data */}
            <details className="p-3 bg-muted rounded-lg">
              <summary className="text-sm font-medium cursor-pointer">
                Raw User Data
              </summary>
              <div className="mt-2 bg-background p-2 rounded border overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No user connected</p>
            <p className="text-xs">Use FCL commands in the sidebar to authenticate</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}