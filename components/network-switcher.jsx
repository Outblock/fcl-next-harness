import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Network, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import * as fcl from '@onflow/fcl'

const NETWORKS = {
  testnet: {
    name: 'Flow Testnet',
    network: 'testnet',
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  mainnet: {
    name: 'Flow Mainnet',
    network: 'mainnet',
    accessNode: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  local: {
    name: 'Local Emulator',
    network: 'local',
    accessNode: 'http://localhost:8888',
    discoveryWallet: 'http://localhost:8701/fcl/authn',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  }
}

export function NetworkSwitcher({ currentNetwork, onNetworkChange, onAddMessage }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleNetworkSwitch = async (networkKey) => {
    if (networkKey === currentNetwork || isLoading) return

    setIsLoading(true)
    const network = NETWORKS[networkKey]

    try {
      onAddMessage('request', `Switching to ${network.name}...`, 'Network Switch')
      
      // Update FCL configuration
      await fcl.config({
        'flow.network': network.network,
        'accessNode.api': network.accessNode,
        'discovery.wallet': network.discoveryWallet,
      })

      onAddMessage('response', `Successfully switched to ${network.name}`, 'Network Switch')
      onNetworkChange(networkKey)
      
    } catch (error) {
      onAddMessage('error', `Failed to switch network: ${error.message}`, 'Network Switch')
    } finally {
      setIsLoading(false)
    }
  }

  const currentNetworkConfig = NETWORKS[currentNetwork] || NETWORKS.testnet

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Network className="h-4 w-4" />
          Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Current Network Display */}
          <div className={cn(
            "p-3 rounded-lg border",
            currentNetworkConfig.bgColor,
            currentNetworkConfig.borderColor
          )}>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full bg-current", currentNetworkConfig.color)} />
              <span className="font-medium text-sm">{currentNetworkConfig.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentNetworkConfig.accessNode}
            </div>
          </div>

          {/* Network Options */}
          <div className="space-y-1">
            {Object.entries(NETWORKS).map(([key, network]) => (
              <Button
                key={key}
                variant={currentNetwork === key ? "default" : "ghost"}
                size="sm"
                className="w-full justify-between text-xs h-8"
                onClick={() => handleNetworkSwitch(key)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full bg-current", network.color)} />
                  <span>{network.name}</span>
                </div>
                {currentNetwork === key && <Check className="h-3 w-3" />}
              </Button>
            ))}
          </div>

          {/* Network Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <div><strong>Access Node:</strong> {currentNetworkConfig.accessNode}</div>
            <div><strong>Discovery:</strong> {currentNetworkConfig.discoveryWallet}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}