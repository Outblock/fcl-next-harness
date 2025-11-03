import * as fcl from "@onflow/fcl"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/router'
import "../flow/config"
import useCurrentUser from "../hooks/use-current-user"
import useConfig from "../hooks/use-config"
import { init } from "@onflow/fcl-wc"
import Loading from "./loading"
import Image from "next/image"
import { MainLayout } from "../components/main-layout"
import { MessagePanel } from "../components/message-panel"
import { CurrentUserPanel } from "../components/current-user-panel"
import { MessagesPage } from "../components/messages-page"
import { NetworkSwitcher } from "../components/network-switcher"
import { ScriptsPage } from "../components/scripts-page"
import { TransactionsPage } from "../components/transactions-page"
import { SignMessagePage } from "../components/sign-message-page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Wallet, Settings, Activity, Users, Network, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react"
import { cn } from "../lib/utils"

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID
const WC_METADATA = {
  name: "FCL Harness",
  description: "FCL Harness dApp for Development and Testing",
  url: "https://flow.com/",
  icons: ["https://avatars.githubusercontent.com/u/62387156?s=280&v=4"],
}

export default function Home() {
  const router = useRouter()
  const currentUser = useCurrentUser()
  const config = useConfig()
  const [services, setServices] = useState([])
  const [customWalletServices, setCustomWalletServices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const discoveryWalletInputRef = useRef(null)
  const walletNameInputRef = useRef(null)
  const displayMethodRef = useRef(null)
  const [isPluginAdded, setIsPluginAdded] = useState(false)
  const [messages, setMessages] = useState([])
  const [connectionStats, setConnectionStats] = useState({ requests: 0, responses: 0, errors: 0 })
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentNetwork, setCurrentNetwork] = useState('testnet')
  const [authMethod, setAuthMethod] = useState('POP/RPC')

  const authMethods = [
    { value: 'HTTP/RPC', label: 'HTTP/RPC - HTTP Remote Procedure Call' },
    { value: 'HTTP/POST', label: 'HTTP/POST - HTTP POST Request' },
    { value: 'IFRAME/RPC', label: 'IFRAME/RPC - In-page iframe RPC' },
    { value: 'POP/RPC', label: 'POP/RPC - Popup window RPC' },
    { value: 'TAB/RPC', label: 'TAB/RPC - New tab RPC' },
    { value: 'EXT/RPC', label: 'EXT/RPC - Browser extension RPC' },
    { value: 'DEEPLINK/RPC', label: 'DEEPLINK/RPC - Deep link RPC' }
  ]

  const addMessage = (type, message, method = null) => {
    const timestamp = new Date().getTime() // Use timestamp instead of string
    const newMessage = {
      type,
      content: message, // Change 'message' to 'content' to match main-layout
      category: method, // Change 'method' to 'category' to match main-layout
      timestamp,
      data: typeof message === 'object' ? message : null
    }
    setMessages(prev => [...prev, newMessage])
    
    // Update stats
    setConnectionStats(prev => ({
      ...prev,
      [type === 'request' ? 'requests' : type === 'response' ? 'responses' : 'errors']: 
        prev[type === 'request' ? 'requests' : type === 'response' ? 'responses' : 'errors'] + 1
    }))
  }

  const clearMessages = () => {
    setMessages([])
    setConnectionStats({ requests: 0, responses: 0, errors: 0 })
  }

  // Handle page change with router
  const handlePageChange = (page) => {
    setCurrentPage(page)
    const pageMap = {
      'dashboard': '/',
      'scripts': '/?tab=scripts',
      'transactions': '/?tab=transactions',  
      'signMessage': '/?tab=signMessage',
      'messages': '/?tab=messages',
      'user': '/?tab=user'
    }
    router.push(pageMap[page] || '/', undefined, { shallow: true })
  }

  // Initialize page from URL on mount
  useEffect(() => {
    const { tab } = router.query
    if (tab && ['scripts', 'transactions', 'signMessage', 'messages', 'user'].includes(tab)) {
      setCurrentPage(tab)
    }
  }, [router.query])

  async function clickHandler(fn, args = null) {
    setIsLoading(true)
    try {
      addMessage('request', `Executing command...`, 'FCL Command')
      const result = await fn(args)
      addMessage('response', result || 'Command completed successfully', 'FCL Command')
    } catch (error) {
      addMessage('error', error.message || 'Command failed', 'FCL Command')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      addMessage('request', 'Logging out...', 'FCL Logout')
      await fcl.unauthenticate()
      addMessage('response', 'Successfully logged out', 'FCL Logout')
    } catch (error) {
      addMessage('error', error.message || 'Logout failed', 'FCL Logout')
    }
  }

  const handleRefreshUser = async () => {
    try {
      addMessage('request', 'Refreshing user data...', 'FCL Refresh')
      // FCL will automatically update currentUser
      addMessage('response', 'User data refreshed', 'FCL Refresh')
    } catch (error) {
      addMessage('error', error.message || 'Refresh failed', 'FCL Refresh')
    }
  }

  const handleStandardLogin = async () => {
    try {
      // Set custom endpoint if provided
      const endpoint = discoveryWalletInputRef?.current?.value
      if (endpoint && endpoint !== 'http://localhost:3000/authn') {
        fcl.config().put("discovery.wallet", endpoint)
        addMessage('request', `Setting custom discovery.wallet to: ${endpoint}`, 'Config')
      }
      
      addMessage('request', `Attempting login with method: ${authMethod}`, 'FCL Authenticate')
      
      // Set the wallet method configuration
      fcl.config().put('discovery.wallet.method.default', authMethod)
      addMessage('request', `Set discovery.wallet.method.default to: ${authMethod}`, 'Config')
      
      // Reauthenticate using FCL authn (allows switching wallets)
      const user = await fcl.reauthenticate()
      addMessage('response', `Successfully authenticated with ${authMethod}`, 'FCL Reauthenticate')
      
    } catch (error) {
      addMessage('error', error.message || `Authentication with ${authMethod} failed`, 'FCL Authenticate')
    }
  }

  useEffect(() => {
    const initAdapter = async () => {
      const { FclWcServicePlugin } = await init({
        projectId: WC_PROJECT_ID,
        metadata: WC_METADATA,
        includeBaseWC: true,
        wallets: [],
        sessionRequestHook: data => {
          console.log("WC Request data", data)
        },
      })
      fcl.pluginRegistry.add(FclWcServicePlugin)
    }

    if (
      !isPluginAdded &&
      config &&
      config["flow.network"] !== "local" &&
      process.env.NEXT_PUBLIC_WC_PROJECT_ID
    ) {
      initAdapter()
      setIsPluginAdded(true)
    }
  }, [config, isPluginAdded])

  useEffect(() => {
    const fetchServices = async () =>
      await fcl.discovery.authn.subscribe(res => {
        setServices(res.results)
      })
    if (config && config["discovery.authn.endpoint"]) fetchServices()
  }, [config])

  // Load custom wallet services from localStorage
  useEffect(() => {
    const loadCustomServices = () => {
      try {
        const stored = localStorage.getItem('fcl-custom-wallet-services')
        if (stored) {
          setCustomWalletServices(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Error loading custom wallet services:', error)
      }
    }
    loadCustomServices()
  }, [])

  // Save custom wallet services to localStorage whenever they change
  const saveCustomServices = (services) => {
    try {
      localStorage.setItem('fcl-custom-wallet-services', JSON.stringify(services))
    } catch (error) {
      console.error('Error saving custom wallet services:', error)
    }
  }

  // Add custom wallet service
  const addCustomWalletService = (name, endpoint, strategy = 'POP/RPC') => {
    const newService = {
      id: Date.now().toString(),
      provider: {
        name: name,
        icon: '/favicon.ico', // Default icon
        address: endpoint
      },
      isCustom: true,
      endpoint: endpoint,
      strategy: strategy
    }
    const updatedServices = [...customWalletServices, newService]
    setCustomWalletServices(updatedServices)
    saveCustomServices(updatedServices)
  }

  // Remove custom wallet service
  const removeCustomWalletService = (id) => {
    const updatedServices = customWalletServices.filter(service => service.id !== id)
    setCustomWalletServices(updatedServices)
    saveCustomServices(updatedServices)
  }

  // Handle custom wallet service connection
  const handleCustomWalletConnect = async (customService) => {
    try {
      setIsLoading(true)
      
      // Configure FCL with custom wallet endpoint and method
      const config = fcl.config()
        .put('discovery.wallet.method', customService.strategy || 'POP/RPC')
        .put('discovery.wallet.method.default', customService.endpoint)
        .put('challenge.handshake', customService.endpoint)
      
      // Also set the wallet endpoint for discovery
      if (customService.endpoint) {
        config.put('discovery.wallet', customService.endpoint)
      }
      
      await config
      
      addMessage('request', `FCL Config: wallet endpoint="${customService.endpoint}", method="${customService.strategy || 'POP/RPC'}"`, 'Custom Wallet')
      
      // Reauthenticate with the configured wallet (allows switching wallets)
      const user = await fcl.reauthenticate()
      addMessage('response', `Successfully connected to ${customService.provider.name}`, 'Custom Wallet')
    } catch (error) {
      console.error('Custom wallet connection error:', error)
      addMessage('error', error.message || `Connection to ${customService.provider.name} failed`, 'Custom Wallet')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    require("../decorate")
    
    // Enhanced message listener
    const handleMessage = (event) => {
      console.log("Harness Message Received", event.data)
      
      // Try to parse the message
      let messageData = event.data
      if (typeof messageData === 'string') {
        try {
          messageData = JSON.parse(messageData)
        } catch (e) {
          // Keep as string if not JSON
        }
      }
      
      // Determine message type based on content
      let type = 'message'
      let method = null
      
      if (messageData && typeof messageData === 'object') {
        if (messageData.type || messageData.method) {
          method = messageData.method || messageData.type
        }
        
        // Detect if it's a request or response
        if (messageData.id && !messageData.result && !messageData.error) {
          type = 'request'
        } else if (messageData.id && (messageData.result || messageData.error)) {
          type = messageData.error ? 'error' : 'response'
        }
      }
      
      addMessage(type, messageData, method)
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'scripts':
        return (
          <ScriptsPage 
            onCommandClick={clickHandler}
            isLoading={isLoading}
            onAddMessage={addMessage}
          />
        )
      case 'transactions':
        return (
          <TransactionsPage 
            onCommandClick={clickHandler}
            isLoading={isLoading}
            onAddMessage={addMessage}
          />
        )
      case 'signMessage':
        return (
          <SignMessagePage 
            onCommandClick={clickHandler}
            isLoading={isLoading}
            onAddMessage={addMessage}
          />
        )
      case 'messages':
        return (
          <MessagesPage 
            messages={messages}
            onClearMessages={clearMessages}
            connectionStats={connectionStats}
          />
        )
      case 'user':
        return (
          <CurrentUserPanel 
            currentUser={currentUser}
            config={config}
            onLogout={handleLogout}
            onRefresh={handleRefreshUser}
          />
        )
      default: // dashboard
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
                FCL Harness Dashboard
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Connect your wallet and interact with the Flow blockchain. Use FCL commands from the sidebar to test various operations.
              </p>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-lg font-bold capitalize">{currentNetwork}</p>
                      <p className="text-xs text-muted-foreground">Network</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    {currentUser?.loggedIn ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-bold">
                        {currentUser?.loggedIn ? 'Connected' : 'Disconnected'}
                      </p>
                      <p className="text-xs text-muted-foreground">Wallet Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{services?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Available Wallets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{messages.length}</p>
                      <p className="text-xs text-muted-foreground">Total Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Connection */}
            <div className="space-y-6">
              {/* Available Wallet Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wallet className="h-5 w-5" />
                    Available Wallet Services
                  </CardTitle>
                  <CardDescription>
                    Connect to wallets discovered on Flow {currentNetwork}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(services?.length > 0 || customWalletServices?.length > 0) ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Discovered Services */}
                        {services?.map(service => (
                          <Button 
                            key={service.provider.address}
                            onClick={() => clickHandler(fcl.reauthenticate, { service })}
                            variant="outline"
                            className="w-full justify-start h-16 p-4 hover:bg-accent transition-all duration-200"
                            disabled={isLoading}
                          >
                            <div className="flex items-center w-full">
                              <div className="mr-4 flex-shrink-0">
                                <Image
                                  src={service.provider.icon}
                                  alt="Wallet Icon"
                                  width={32}
                                  height={32}
                                  className="rounded"
                                />
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-foreground">{service.provider.name}</div>
                                <div className="text-xs text-muted-foreground">FCL Discovery Service</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                        
                        {/* Custom Services */}
                        {customWalletServices?.map(service => (
                          <div key={service.id} className="relative">
                            <Button 
                              onClick={() => handleCustomWalletConnect(service)}
                              variant="outline"
                              className="w-full justify-start h-16 p-4 hover:bg-accent transition-all duration-200 pr-12"
                              disabled={isLoading}
                            >
                              <div className="flex items-center w-full">
                                <div className="mr-4 flex-shrink-0">
                                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                                <div className="text-left flex-1">
                                  <div className="font-semibold text-foreground">{service.provider.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Custom • {service.strategy || 'POP/RPC'}
                                  </div>
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              onClick={() => {
                                removeCustomWalletService(service.id)
                                addMessage('response', `Removed custom wallet: ${service.provider.name}`, 'Custom Wallet')
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* FCL Connect Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleStandardLogin}
                          className="w-full"
                          disabled={isLoading}
                        >
                          Connect with FCL ({authMethod.split('/')[0]})
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Or use FCL with {authMethod} authentication method
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground py-4">
                        <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No wallet services available</p>
                        <p className="text-xs">Add custom wallets using the form below or check network connection</p>
                      </div>
                      
                      {/* FCL Connect Button for no discovered services */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleStandardLogin}
                          className="w-full"
                          disabled={isLoading}
                        >
                          Connect with FCL ({authMethod.split('/')[0]})
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Use FCL with {authMethod} authentication method
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Custom Wallet */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-5 w-5" />
                    Add Custom Wallet
                  </CardTitle>
                  <CardDescription>
                    Add a custom wallet service to your available wallets list
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wallet-name" className="text-sm">
                        Wallet Name
                      </Label>
                      <Input 
                        id="wallet-name"
                        placeholder="My Custom Wallet"
                        ref={walletNameInputRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wallet-endpoint" className="text-sm">
                        Wallet Endpoint
                      </Label>
                      <Input 
                        ref={discoveryWalletInputRef} 
                        id="wallet-endpoint"
                        placeholder="http://localhost:3000/authn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Authentication Strategy</Label>
                      <Select defaultValue="POP/RPC" ref={displayMethodRef}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authentication strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POP/RPC">POP/RPC (Popup)</SelectItem>
                          <SelectItem value="IFRAME/RPC">IFRAME/RPC (Embedded)</SelectItem>
                          <SelectItem value="TAB/RPC">TAB/RPC (New Tab)</SelectItem>
                          <SelectItem value="HTTP/POST">HTTP/POST</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose the FCL authentication strategy for this wallet
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const walletName = walletNameInputRef.current?.value?.trim()
                        const walletEndpoint = discoveryWalletInputRef.current?.value?.trim()
                        const strategy = displayMethodRef.current?.value || 'POP/RPC'
                        
                        if (walletName && walletEndpoint) {
                          addCustomWalletService(walletName, walletEndpoint, strategy)
                          addMessage('response', `Added custom wallet: ${walletName} (${strategy})`, 'Custom Wallet')
                          
                          // Clear inputs
                          walletNameInputRef.current.value = ''
                          discoveryWalletInputRef.current.value = ''
                        } else {
                          addMessage('error', 'Please provide both wallet name and endpoint', 'Custom Wallet')
                        }
                      }}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Wallet List
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current User Quick Info */}
              {currentUser?.loggedIn && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Connected User</CardTitle>
                    <CardDescription>
                      Currently connected wallet information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium text-foreground">Wallet Address</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {currentUser.addr?.substring(0, 8)}...{currentUser.addr?.substring(currentUser.addr.length - 6)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(currentUser.addr)}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshUser}
                          disabled={isLoading}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLogout}
                          disabled={isLoading}
                        >
                          Logout
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange('user')}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* FCL Configuration */}
              {config && Object.keys(config).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Settings className="h-5 w-5" />
                      FCL Configuration
                    </CardTitle>
                    <CardDescription>
                      Current Flow Client Library configuration settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <details className="p-3 bg-muted rounded-lg">
                      <summary className="text-sm font-medium cursor-pointer">
                        View Configuration Details
                      </summary>
                      <div className="mt-2 bg-background p-3 rounded border overflow-auto max-h-48">
                        <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                          {JSON.stringify(config, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <MainLayout 
      title={currentPage === 'dashboard' ? 'FCL Harness Dashboard' : 
             currentPage === 'scripts' ? 'FCL Scripts' :
             currentPage === 'transactions' ? 'FCL Transactions' :
             currentPage === 'signMessage' ? 'Message Signing' :
             currentPage === 'messages' ? 'Communication Messages' : 
             'User Information'}
      onCommandClick={clickHandler}
      isLoading={isLoading}
      currentNetwork={currentNetwork}
      currentPage={currentPage}
      onPageChange={handlePageChange}
      onNetworkChange={setCurrentNetwork}
      onAddMessage={addMessage}
      messages={messages}
      onClearMessages={clearMessages}
      connectionStats={connectionStats}
    >
      {renderCurrentPage()}
      {isLoading ? <Loading /> : null}
    </MainLayout>
  )
}
