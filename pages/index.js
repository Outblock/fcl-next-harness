import * as fcl from "@onflow/fcl"
import { useState, useEffect, useRef } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Wallet, Settings, Activity, Users, Network, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID
const WC_METADATA = {
  name: "FCL Harness",
  description: "FCL Harness dApp for Development and Testing",
  url: "https://flow.com/",
  icons: ["https://avatars.githubusercontent.com/u/62387156?s=280&v=4"],
}

export default function Home() {
  const currentUser = useCurrentUser()
  const config = useConfig()
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const discoveryWalletInputRef = useRef(null)
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
    const timestamp = new Date().toLocaleTimeString()
    const newMessage = {
      type,
      message,
      method,
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
      addMessage('request', `Attempting login with method: ${authMethod}`, 'FCL Authenticate')
      
      // Set the wallet method configuration
      fcl.config().put('discovery.wallet.method.default', authMethod)
      addMessage('request', `Set discovery.wallet.method.default to: ${authMethod}`, 'Config')
      
      // Authenticate using FCL authn
      const user = await fcl.authenticate()
      addMessage('response', `Successfully authenticated with ${authMethod}`, 'FCL Authenticate')
      
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
                  {services?.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {services.map(service => (
                        <Button 
                          key={service.provider.address}
                          onClick={() => clickHandler(fcl.authenticate, { service })}
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
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No wallet services discovered</p>
                      <p className="text-xs">Check network connection or use custom configuration</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom Wallet Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Settings className="h-5 w-5" />
                    Custom Wallet Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure authentication method and custom endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Standard FCL Authentication with Method Selection */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="auth-method" className="text-sm">
                          Authentication Method
                        </Label>
                        <Select value={authMethod} onValueChange={setAuthMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select authentication method" />
                          </SelectTrigger>
                          <SelectContent>
                            {authMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-endpoint" className="text-sm">
                          Custom Wallet Endpoint (Optional)
                        </Label>
                        <Input 
                          ref={discoveryWalletInputRef} 
                          id="custom-endpoint"
                          defaultValue="http://localhost:3000/authn"
                          placeholder="http://localhost:3000/authn"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleStandardLogin}
                          className="flex-1"
                          disabled={isLoading}
                        >
                          Connect with FCL ({authMethod.split('/')[0]})
                        </Button>
                        <Button
                          onClick={() => {
                            const endpoint = discoveryWalletInputRef?.current?.value
                            if (endpoint) {
                              fcl.config().put("discovery.wallet", endpoint)
                              addMessage('request', `Setting discovery.wallet to: ${endpoint}`, 'Config')
                            }
                          }}
                          variant="outline"
                          disabled={isLoading}
                        >
                          Set Endpoint
                        </Button>
                      </div>
                    </div>
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
                          onClick={() => setCurrentPage('user')}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
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
             currentPage === 'messages' ? 'Communication Messages' : 
             'User Information'}
      onCommandClick={clickHandler}
      isLoading={isLoading}
      currentNetwork={currentNetwork}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onNetworkChange={setCurrentNetwork}
      onAddMessage={addMessage}
    >
      {renderCurrentPage()}
      {isLoading ? <Loading /> : null}
    </MainLayout>
  )
}
