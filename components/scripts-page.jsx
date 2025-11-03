import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { FileText, Play, CheckCircle2, AlertCircle, Loader2, Copy, Code, Clock, Hash } from 'lucide-react'
import * as fcl from "@onflow/fcl"

const SCRIPT_EXAMPLES = [
  {
    id: 'query1',
    name: 'Query 1 (No Arguments)',
    description: 'Basic Flow script without parameters',
    cadence: `access(all) fun main(): Int {
    return 7
}`,
    arguments: [],
    command: 'Query 1 (no args)'
  },
  {
    id: 'query2', 
    name: 'Query 2 (With Arguments)',
    description: 'Flow script with parameters',
    cadence: `access(all) fun main(a: Int, b: Int): Int {
    return a + b
}`,
    arguments: [
      { type: 'Int', value: 5 },
      { type: 'Int', value: 7 }
    ],
    command: 'Query 2 (with args)'
  }
]

export function ScriptsPage({ onCommandClick, isLoading, onAddMessage }) {
  const [selectedScript, setSelectedScript] = useState('query1')
  const [customCadence, setCustomCadence] = useState(SCRIPT_EXAMPLES[0].cadence)
  const [customArguments, setCustomArguments] = useState('')
  const [scriptStatus, setScriptStatus] = useState('idle')
  const [scriptResult, setScriptResult] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)

  const currentExample = SCRIPT_EXAMPLES.find(ex => ex.id === selectedScript)

  // Update form when example changes
  const handleExampleChange = (exampleId) => {
    const example = SCRIPT_EXAMPLES.find(ex => ex.id === exampleId)
    if (example) {
      setSelectedScript(exampleId)
      setCustomCadence(example.cadence)
      setCustomArguments(example.arguments.length > 0 ? JSON.stringify(example.arguments, null, 2) : '')
    }
  }

  const handleExecuteScript = async () => {
    if (!customCadence.trim()) return

    setScriptStatus('running')
    setScriptResult(null)
    setExecutionTime(null)

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

      onAddMessage?.('request', `Executing script with ${args.length} arguments`, 'Script')

      // Execute the script using FCL query
      const queryConfig = {
        cadence: customCadence
      }

      // Only add args if there are any
      if (args.length > 0) {
        queryConfig.args = (arg, t) => args.map(a => arg(a.value, t[a.type]))
      }

      const result = await fcl.query(queryConfig)

      const endTime = Date.now()
      const duration = endTime - startTime

      setScriptResult(result)
      setExecutionTime(duration)
      setScriptStatus('success')
      onAddMessage?.('response', `Script executed successfully: ${JSON.stringify(result)}`, 'Script')
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setExecutionTime(duration)
      setScriptStatus('error')
      setScriptResult({ error: error.message })
      onAddMessage?.('error', error.message || 'Script execution failed', 'Script')
    }

    setTimeout(() => setScriptStatus('idle'), 5000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    onAddMessage?.('response', 'Copied to clipboard', 'Copy')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
          FCL Scripts
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Execute Cadence scripts on the Flow blockchain. Edit code and parameters, then run to query blockchain state.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Script Input */}
        <div className="space-y-6">
          {/* Example Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Code className="h-5 w-5" />
                Script Builder
              </CardTitle>
              <CardDescription>
                Select an example or write custom Cadence script code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Script Example</Label>
                  <Select value={selectedScript} onValueChange={handleExampleChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose script example..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCRIPT_EXAMPLES.map((example) => (
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
                    placeholder="Enter Cadence script code..."
                    rows={10}
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
                    placeholder='[{"type": "String", "value": "example"}]'
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Script arguments in JSON format. Each argument needs &quot;type&quot; and &quot;value&quot; fields only. Leave empty for scripts without parameters.
                  </p>
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleExecuteScript}
                  disabled={!customCadence.trim() || isLoading || scriptStatus === 'running'}
                  className="w-full"
                  size="lg"
                >
                  {scriptStatus === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Script
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Script Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Hash className="h-5 w-5" />
                Script Status
              </CardTitle>
              <CardDescription>
                Real-time status and results of script execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20">
                  {scriptStatus === 'idle' && (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      <span className="text-sm text-muted-foreground">Ready to execute</span>
                    </>
                  )}
                  {scriptStatus === 'running' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-blue-600">Executing script...</span>
                    </>
                  )}
                  {scriptStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Script executed successfully</span>
                    </>
                  )}
                  {scriptStatus === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Script execution failed</span>
                    </>
                  )}
                </div>

                {/* Execution Time */}
                {executionTime !== null && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Execution time: {executionTime}ms
                    </span>
                  </div>
                )}

                {/* Script Result */}
                {scriptResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Result</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(scriptResult, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                        {typeof scriptResult === 'string' 
                          ? scriptResult 
                          : JSON.stringify(scriptResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Current Script Info */}
                {currentExample && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground">Current Script</h4>
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
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Script Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                Script Preview
              </CardTitle>
              <CardDescription>
                Preview of the script that will be executed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">CADENCE CODE</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32">
                      {customCadence}
                    </pre>
                  </div>
                </div>
                
                {customArguments && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">ARGUMENTS</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                        {customArguments || '[]'}
                      </pre>
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