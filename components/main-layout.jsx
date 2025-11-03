import { useState } from 'react'
import { Button } from './ui/button'
import { Menu, X, Settings, Home, FlameIcon as Flow, MessageSquare, ChevronDown, FileText, Zap, PenTool } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from '../lib/utils'

export function MainLayout({ children, title = "FCL Harness", onCommandClick, isLoading, currentNetwork = 'testnet', currentPage = 'dashboard', onPageChange, onNetworkChange, onAddMessage, messages = [], onClearMessages, connectionStats = { requests: 0, responses: 0, errors: 0 } }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messagePanelOpen, setMessagePanelOpen] = useState(false)
  const [activeCommand, setActiveCommand] = useState(null)
  const [messageFilter, setMessageFilter] = useState('fcl')

  const networkOptions = [
    {
      name: 'mainnet',
      label: 'Flow Mainnet',
      accessNode: 'https://rest-mainnet.onflow.org',
      discoveryWallet: 'https://fcl-discovery.onflow.org/authn'
    },
    {
      name: 'testnet', 
      label: 'Flow Testnet',
      accessNode: 'https://rest-testnet.onflow.org',
      discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn'
    },
    {
      name: 'local',
      label: 'Local Emulator',
      accessNode: 'http://localhost:8888',
      discoveryWallet: 'http://localhost:8701/fcl/authn'
    }
  ]

  const navigation = [
    { name: 'Dashboard', page: 'dashboard', icon: Home },
    { name: 'Scripts', page: 'scripts', icon: FileText },
    { name: 'Transactions', page: 'transactions', icon: Zap },
    { name: 'SignMessage', page: 'signMessage', icon: PenTool },
    { name: 'Messages', page: 'messages', icon: MessageSquare },
    { name: 'User Info', page: 'user', icon: Settings },
  ]

  const handleCommandClick = async (cmd) => {
    if (onCommandClick) {
      setActiveCommand(cmd.LABEL)
      await onCommandClick(cmd.CMD)
      setActiveCommand(null)
    }
  }

  const handleNetworkChange = async (networkName) => {
    if (onNetworkChange && onAddMessage) {
      const network = networkOptions.find(n => n.name === networkName)
      if (network) {
        onAddMessage?.('request', `Switching to ${network.label}...`, 'Network Switch')
        
        try {
          // Import FCL dynamically to configure it
          const fcl = await import('@onflow/fcl')
          
          // Configure network settings
          fcl.config({
            'flow.network': networkName,
            'accessNode.api': network.accessNode,
            'discovery.wallet': network.discoveryWallet,
            'discovery.authn.endpoint': network.discoveryWallet
          })
          
          onNetworkChange(networkName)
          onAddMessage?.('response', `Successfully switched to ${network.label}`, 'Network Switch')
        } catch (error) {
          onAddMessage?.('error', `Failed to switch to ${network.label}: ${error.message}`, 'Network Switch')
        }
      }
    }
  }

  // Filter messages based on selected filter
  const filteredMessages = messages.filter(msg => {
    if (messageFilter === 'all') return true
    if (messageFilter === 'fcl') return msg.category === 'FCL Command' || msg.category === 'FCL Authenticate' || msg.category === 'FCL Logout' || msg.category === 'FCL Refresh' || msg.category === 'Config' || msg.category === 'Transaction' || msg.category === 'Script' || msg.category === 'Sign Message'
    if (messageFilter === 'system') return !msg.category || msg.category === 'Copy' || msg.category === 'Network Switch'
    return true
  })

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-30 w-64 transform transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Card className="h-full rounded-none border-r">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <Flow className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">FCL Harness</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Main Navigation */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Navigation</h3>
                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <button
                          onClick={() => onPageChange?.(item.page)}
                          className={cn(
                            "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full text-left",
                            currentPage === item.page
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </nav>

            {/* Network info */}
            <div className="p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Connected to Flow {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 relative">
        <header className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl md:text-2xl font-bold truncate text-foreground">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Message Panel Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessagePanelOpen(!messagePanelOpen)}
              className="relative text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <MessageSquare className="h-5 w-5" />
              {filteredMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {filteredMessages.length > 9 ? '9+' : filteredMessages.length}
                </span>
              )}
            </Button>
            
            {/* Network Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 px-3 py-1 h-auto">
                <div className={cn("w-2 h-2 rounded-full", 
                  currentNetwork === 'mainnet' ? 'bg-green-500' : 
                  currentNetwork === 'testnet' ? 'bg-orange-500' : 
                  'bg-blue-500'
                )} />
                <span className="text-sm font-medium text-foreground">
                  {networkOptions.find(n => n.name === currentNetwork)?.label || 'Unknown Network'}
                </span>
                <ChevronDown className="h-3 w-3 text-foreground opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-background border-border">
              <DropdownMenuLabel className="text-foreground">Network Selection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentNetwork} onValueChange={handleNetworkChange}>
                {networkOptions.map((network) => (
                  <DropdownMenuRadioItem 
                    key={network.name} 
                    value={network.name} 
                    className={cn(
                      "cursor-pointer p-3 focus:bg-accent focus:text-accent-foreground rounded-md",
                      currentNetwork === network.name && "bg-green-500/10 border border-green-500/20"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <div className={cn("w-2 h-2 rounded-full", 
                          network.name === 'mainnet' ? 'bg-green-500' : 
                          network.name === 'testnet' ? 'bg-orange-500' : 
                          'bg-blue-500'
                        )} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-foreground">{network.label}</span>
                        <span className="text-xs text-muted-foreground break-all">{network.accessNode}</span>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Message Panel Sidebar */}
        {messagePanelOpen && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMessagePanelOpen(false)} />
        )}
        <div className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l transform transition-transform z-50",
          messagePanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-foreground">Messages</h3>
                <Badge variant="secondary" className="ml-2">
                  {filteredMessages.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {onClearMessages && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearMessages}
                    disabled={messages.length === 0}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessagePanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Filter */}
            <div className="p-4 border-b">
              <Select value={messageFilter} onValueChange={setMessageFilter}>
                <SelectTrigger className="w-full bg-background text-foreground">
                  <SelectValue placeholder="Filter messages..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground">All Messages ({messages.length})</SelectItem>
                  <SelectItem value="fcl" className="text-foreground hover:bg-accent hover:text-accent-foreground">FCL Messages ({messages.filter(msg => msg.category === 'FCL Command' || msg.category === 'FCL Authenticate' || msg.category === 'FCL Logout' || msg.category === 'FCL Refresh' || msg.category === 'Config' || msg.category === 'Transaction' || msg.category === 'Script' || msg.category === 'Sign Message').length})</SelectItem>
                  <SelectItem value="system" className="text-foreground hover:bg-accent hover:text-accent-foreground">System Messages ({messages.filter(msg => !msg.category || msg.category === 'Copy' || msg.category === 'Network Switch').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {messageFilter === 'all' ? 'messages' : messageFilter + ' messages'} yet</p>
                  <p className="text-sm">Wallet-dApp communication will appear here</p>
                </div>
              ) : (
                filteredMessages.map((msg, index) => (
                  <div key={index} className={cn(
                    "flex gap-3 p-3 rounded-lg",
                    msg.type === 'request' ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500' : 
                    msg.type === 'response' ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : 
                    'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500'
                  )}>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            msg.type === 'request' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' : 
                            msg.type === 'response' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 
                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                          )}>
                            {msg.type}
                          </span>
                          {msg.category && (
                            <span className="text-xs text-muted-foreground">
                              {msg.category}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-foreground">
                        {typeof msg.content === 'string' ? (
                          msg.content
                        ) : (
                          <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                            {JSON.stringify(msg.content, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Connection Stats Footer */}
            <div className="border-t p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">{connectionStats.requests}</div>
                  <div className="text-xs text-muted-foreground">Requests</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{connectionStats.responses}</div>
                  <div className="text-xs text-muted-foreground">Responses</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{connectionStats.errors}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}