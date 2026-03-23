import * as fcl from "@onflow/fcl"

try { Object.defineProperty(window, 'fcl', { value: fcl, writable: true, configurable: true }) } catch(e) { /* already defined */ }
try { Object.defineProperty(window, 't', { value: fcl.t, writable: true, configurable: true }) } catch(e) { /* already defined */ }

window.addEventListener("FLOW::TX", d => {
  console.log("FLOW::TX", d.detail.delta, d.detail.txId)
  fcl
    .tx(d.detail.txId)
    .subscribe(txStatus => console.log("TX:STATUS", d.detail.txId, txStatus))
})

window.addEventListener("message", d => {
  console.log("Harness Message Received", d.data)
  return
})
