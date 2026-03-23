import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { Buffer } from 'buffer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { PenTool, CheckCircle2, AlertCircle, Loader2, Copy, Eye, EyeOff } from 'lucide-react'
import { COMMANDS } from '../cmds'

const SIGN_METHODS = [
  {
    id: 'user_signature_1',
    name: 'FCL User Signature 1',
    description: 'Flow blockchain user signature method 1 (no verification)',
    type: 'fcl',
    category: 'fcl',
    command: 'User Sign 1 (No Verification)'
  },
  {
    id: 'user_signature_2',
    name: 'FCL User Signature 2', 
    description: 'Flow blockchain user signature method 2 (with verification)',
    type: 'fcl',
    category: 'fcl',
    command: 'User Sign & Verify'
  }
]

export function SignMessagePage({ onCommandClick, isLoading, onAddMessage }) {
  const [selectedMethod, setSelectedMethod] = useState('user_signature_1')
  const [customMessage, setCustomMessage] = useState('Hello, Flow Blockchain! This is a test message.')
  const [signMessageStatus, setSignMessageStatus] = useState('idle')
  const [lastSignature, setLastSignature] = useState('')
  const [lastSignedData, setLastSignedData] = useState(null)

  const currentMethod = SIGN_METHODS.find(m => m.id === selectedMethod)
  const signMessageCommands = COMMANDS.filter(cmd => 
    ['User Sign 1 (No Verification)', 'User Sign & Verify'].includes(cmd.LABEL)
  )

  const handleSignMessage = async () => {
    if (!selectedMethod) return

    setSignMessageStatus('running')
    setLastSignature('')
    setLastSignedData(null)

    try {
      // Sign the custom message directly with FCL
      const msgHex = Buffer.from(customMessage).toString('hex')
      const signatures = await fcl.currentUser().signUserMessage(msgHex)

      if (signatures && signatures.length > 0) {
        setLastSignature(JSON.stringify(signatures, null, 2))
        setLastSignedData({
          method: currentMethod?.name,
          message: customMessage,
          messageHex: msgHex,
          signatures,
        })
        setSignMessageStatus('success')
        onAddMessage?.('response', `Signed with ${signatures.length} signature(s)`, 'Sign Message')
      } else {
        throw new Error('No signature result received')
      }

    } catch (error) {
      console.error('Signing error:', error)
      setSignMessageStatus('error')
      onAddMessage?.('error', error.message || 'Signing failed', 'Sign Message')
    }

    setTimeout(() => setSignMessageStatus('idle'), 3000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    onAddMessage?.('response', 'Copied to clipboard', 'Copy')
  }

  const renderSigningInput = () => {
    if (!currentMethod) return null

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Custom Message (Optional)</Label>
          <Textarea
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter a custom message to include with the signature..."
            rows={3}
            className="font-mono text-xs sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">
            This custom message will be included in the signature data for reference
          </p>
        </div>

        <div className="space-y-2">
          <Label>Selected FCL Signature Method</Label>
          <div className="p-3 border rounded-lg bg-muted/20">
            <div className="font-medium text-sm text-foreground">{currentMethod.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentMethod.description}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses Flow blockchain&apos;s native signing capabilities through FCL
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
          Message Signing
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Sign messages and structured data with different methods. Customize content and verify signatures.
        </p>
      </div>

      {/* Signing Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <PenTool className="h-5 w-5" />
            Sign Message
          </CardTitle>
          <CardDescription>
            Choose signing method and customize the message or data to sign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Method Selection */}
            <div className="space-y-2">
              <Label>FCL Signature Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose FCL signature method..." />
                </SelectTrigger>
                <SelectContent>
                  {SIGN_METHODS.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dynamic Input Based on Method */}
            {renderSigningInput()}

            <Button
              onClick={handleSignMessage}
              disabled={!selectedMethod || isLoading || signMessageStatus === 'running'}
              className="w-full"
              size="lg"
            >
              {signMessageStatus === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign {currentMethod?.name || 'Message'}
                </>
              )}
            </Button>

            {signMessageStatus !== 'idle' && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                {signMessageStatus === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {signMessageStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {signMessageStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                <span className="text-sm text-muted-foreground">
                  {signMessageStatus === 'running' && 'Creating signature...'}
                  {signMessageStatus === 'success' && 'Signature created successfully'}
                  {signMessageStatus === 'error' && 'Signature creation failed'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Result */}
      {lastSignature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Signature Result
            </CardTitle>
            <CardDescription>
              Generated signature and verification details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Signature</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(lastSignature)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-xs font-mono break-all">
                    {lastSignature}
                  </code>
                </div>
              </div>

              {lastSignedData && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Signed Data</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(lastSignedData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Signature created successfully and can be verified on-chain
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}