import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Zap, CheckCircle2, AlertCircle, Loader2, Copy, Code, PlayCircle, Clock, Hash, FileText, ExternalLink } from 'lucide-react'
import * as fcl from "@onflow/fcl"
import { COMMANDS } from '../cmds'

const TRANSACTION_EXAMPLES = [
  {
    id: 'mutate1',
    name: 'Mutate 1 (No Arguments)',
    description: 'Basic transaction without arguments',
    cadence: `transaction() {
  prepare(signer: auth(Storage, BorrowValue) &Account) {
    log(signer)
  }
}`,
    arguments: [],
    gasLimit: 50,
    command: 'Mutate 1 (no args)'
  },
  {
    id: 'mutate2',
    name: 'Mutate 2 (With Arguments)', 
    description: 'Transaction with parameters',
    cadence: `transaction(greeting: String) {
  prepare(signer: auth(Storage, BorrowValue) &Account) {
    log(signer)
    log(greeting)
  }
}`,
    arguments: [
      { type: 'String', value: 'Hello Flow!' }
    ],
    gasLimit: 100,
    command: 'Mutate 2 (with args)'
  }
]

// Get blockchain explorer URL based on network
const getExplorerUrl = (txId, network) => {
  const host = network === 'mainnet' ? 'mainnet.flowscan.io' : 'testnet.flowscan.io'
  return `https://${host}/tx/${txId}`
}

export function TransactionsPage({ onCommandClick, isLoading, onAddMessage, currentNetwork = 'testnet' }) {
  const [selectedTransaction, setSelectedTransaction] = useState('mutate1')
  const [customCadence, setCustomCadence] = useState(TRANSACTION_EXAMPLES[0].cadence)
  const [customArguments, setCustomArguments] = useState('')
  const [gasLimit, setGasLimit] = useState(50)
  const [transactionStatus, setTransactionStatus] = useState('idle')
  const [transactionResult, setTransactionResult] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)
  const [txId, setTxId] = useState(null)
  const [txStatus, setTxStatus] = useState(null)
  const [txError, setTxError] = useState(null)


  const currentExample = TRANSACTION_EXAMPLES.find(ex => ex.id === selectedTransaction)

  // Monitor transaction status after txId is available
  const monitorTransactionStatus = async (transactionId) => {
    try {
      setTxId(transactionId)
      setTxStatus('PENDING')
      setTxError(null)
      onAddMessage?.('request', `Monitoring transaction: ${transactionId}`, 'Transaction Status')
      
      // Use FCL tx to monitor transaction status
      const txStatus = await fcl.tx(transactionId).onceSealed()
      
      if (txStatus.status === 4) { // SEALED
        if (txStatus.statusCode === 0) {
          setTxStatus('SEALED_SUCCESS')
          onAddMessage?.('response', `Transaction sealed successfully: ${transactionId}`, 'Transaction Status')
        } else {
          setTxStatus('SEALED_ERROR')
          setTxError(txStatus.errorMessage || 'Transaction failed with unknown error')
          onAddMessage?.('error', `Transaction failed: ${txStatus.errorMessage || 'Unknown error'}`, 'Transaction Status')
        }
      } else {
        setTxStatus('UNKNOWN')
        onAddMessage?.('response', `Transaction status: ${txStatus.status}`, 'Transaction Status')
      }
    } catch (error) {
      setTxStatus('ERROR')
      setTxError(error.message)
      onAddMessage?.('error', `Error monitoring transaction: ${error.message}`, 'Transaction Status')
    }
  }

  // Update form when example changes
  const handleExampleChange = (exampleId) => {
    const example = TRANSACTION_EXAMPLES.find(ex => ex.id === exampleId)
    if (example) {
      setSelectedTransaction(exampleId)
      setCustomCadence(example.cadence)
      setCustomArguments(example.arguments.length > 0 ? JSON.stringify(example.arguments, null, 2) : '')
      setGasLimit(example.gasLimit)
    }
  }

  const handleSendTransaction = async () => {
    if (!customCadence.trim()) return

    setTransactionStatus('running')
    setTransactionResult(null)
    setExecutionTime(null)
    setTxId(null)
    setTxStatus(null)
    setTxError(null)

    const startTime = Date.now()

    try {
      // Parse arguments if provided
      let args = []
      if (customArguments.trim()) {
        try {
          args = JSON.parse(customArguments)
        } catch (parseError) {
          throw new Error('Invalid JSON format in arguments')
        }
      }

      onAddMessage?.('request', `Executing transaction with ${args.length} arguments`, 'Transaction')

      // Execute the transaction using FCL mutate
      const mutateConfig = {
        cadence: customCadence,
        gasLimit: gasLimit
      }

      // Only add args if there are any
      if (args.length > 0) {
        mutateConfig.args = (arg, t) => args.map(a => arg(a.value, t[a.type]))
      }

      const transactionId = await fcl.mutate(mutateConfig)

      const endTime = Date.now()
      const duration = endTime - startTime

      setTransactionResult(transactionId)
      setExecutionTime(duration)
      setTransactionStatus('success')
      onAddMessage?.('response', `Transaction submitted with ID: ${transactionId}`, 'Transaction')
      
      // Start monitoring transaction status
      monitorTransactionStatus(transactionId)
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setExecutionTime(duration)
      setTransactionStatus('error')
      setTransactionResult({ error: error.message })
      onAddMessage?.('error', error.message || 'Transaction execution failed', 'Transaction')
    }

    setTimeout(() => setTransactionStatus('idle'), 5000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    onAddMessage?.('response', 'Copied to clipboard', 'Copy')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
          FCL Transactions
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Execute Cadence transactions on the Flow blockchain. Edit code and parameters, then send to modify blockchain state.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Transaction Input */}
        <div className="space-y-6">
          {/* Example Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Code className="h-5 w-5" />
                Transaction Builder
              </CardTitle>
              <CardDescription>
                Select an example or write custom Cadence transaction code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction Example</Label>
                  <Select value={selectedTransaction} onValueChange={handleExampleChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose transaction example..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_EXAMPLES.map((example) => (
                        <SelectItem key={example.id} value={example.id}>
                          {example.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentExample && (
                    <p className="text-xs text-muted-foreground">
                      {currentExample.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Cadence Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cadence">Cadence Code</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(customCadence)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    id="cadence"
                    value={customCadence}
                    onChange={(e) => setCustomCadence(e.target.value)}
                    placeholder="Enter Cadence transaction code..."
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>

                {/* Arguments */}
                <div className="space-y-2">
                  <Label htmlFor="arguments">Arguments (JSON Array)</Label>
                  <Textarea
                    id="arguments"
                    value={customArguments}
                    onChange={(e) => setCustomArguments(e.target.value)}
                    placeholder='[{"name": "param1", "type": "String", "value": "example"}]'
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Transaction arguments in JSON format. Leave empty for transactions without parameters.
                  </p>
                </div>

                {/* Gas Limit */}
                <div className="space-y-2">
                  <Label htmlFor="gasLimit">Gas Limit</Label>
                  <Input
                    id="gasLimit"
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(parseInt(e.target.value) || 50)}
                    className="w-full"
                  />
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleSendTransaction}
                  disabled={!currentExample || isLoading || transactionStatus === 'running'}
                  className="w-full"
                  size="lg"
                >
                  {transactionStatus === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Execute Transaction
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transaction Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Hash className="h-5 w-5" />
                Transaction Status
              </CardTitle>
              <CardDescription>
                Real-time status and results of transaction execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20">
                  {transactionStatus === 'idle' && (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      <span className="text-sm text-muted-foreground">Ready to execute</span>
                    </>
                  )}
                  {transactionStatus === 'running' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-blue-600">Executing transaction...</span>
                    </>
                  )}
                  {transactionStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Transaction successful</span>
                    </>
                  )}
                  {transactionStatus === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Transaction failed</span>
                    </>
                  )}
                </div>

                {/* Transaction ID */}
                {txId && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Transaction ID</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(txId, currentNetwork), '_blank')}
                          title="View on Flow Explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(txId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-xs font-mono break-all">
                        {txId}
                      </code>
                    </div>
                  </div>
                )}

                {/* On-chain Status */}
                {txStatus && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg border">
                    {txStatus === 'PENDING' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600">Transaction pending on blockchain...</span>
                      </>
                    )}
                    {txStatus === 'SEALED_SUCCESS' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Transaction sealed successfully</span>
                      </>
                    )}
                    {txStatus === 'SEALED_ERROR' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Transaction failed on blockchain</span>
                      </>
                    )}
                    {(txStatus === 'ERROR' || txStatus === 'UNKNOWN') && (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Transaction status unknown</span>
                      </>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {txError && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600">Error Details</Label>
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap">
                        {txError}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Execution Time */}
                {executionTime !== null && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Execution time: {executionTime}ms
                    </span>
                  </div>
                )}

                {/* Transaction Result */}
                {transactionResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Result</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(transactionResult, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                        {typeof transactionResult === 'string' 
                          ? transactionResult 
                          : JSON.stringify(transactionResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Current Transaction Info */}
                {currentExample && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground">Current Transaction</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-mono">{currentExample.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arguments:</span>
                        <Badge variant={currentExample.arguments.length > 0 ? "default" : "secondary"}>
                          {currentExample.arguments.length} params
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas Limit:</span>
                        <span className="font-mono">{gasLimit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}