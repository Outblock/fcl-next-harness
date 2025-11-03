import { useState } from 'react'
import { Button } from './ui/button'
import { Menu, X, Wallet, Code, Network, Settings, Home, FlameIcon as Flow, Play, MessageSquare, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { COMMANDS } from '../cmds'

export function MainLayout({ children, title = "FCL Harness", onCommandClick, isLoading, currentNetwork = 'testnet', currentPage = 'dashboard', onPageChange, onNetworkChange, onAddMessage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeCommand, setActiveCommand] = useState(null)

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

                {/* FCL Commands */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">FCL Commands</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {COMMANDS.map((cmd, index) => (
                      <Button
                        key={cmd.LABEL}
                        onClick={() => handleCommandClick(cmd)}
                        variant={activeCommand === cmd.LABEL ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        disabled={isLoading || activeCommand === cmd.LABEL}
                      >
                        <div className="flex items-center space-x-2">
                          <Play className="h-3 w-3" />
                          <span className="text-xs truncate">{cmd.LABEL}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
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
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl md:text-2xl font-bold truncate text-foreground">{title}</h1>
          </div>
          
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
                <ChevronDown className="h-3 w-3 opacity-50" />
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
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}