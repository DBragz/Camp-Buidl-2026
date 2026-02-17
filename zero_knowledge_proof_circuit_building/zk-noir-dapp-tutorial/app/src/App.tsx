import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ConnectKitButton } from 'connectkit'
import { poseidon2 } from 'poseidon-lite'
import { randomBytes } from '@aztec/bb.js'
import {
  bytesToBigInt,
  erc20Abi,
  toBytes,
  toHex,
  parseEther,
  formatEther,
  type Address,
  isAddressEqual,
} from 'viem'
import { useConfig, useWriteContract, usePublicClient } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { Prover } from './lib/prover'
import { createMerkleTree } from './lib/merkle'

const WORMHOLE_LOCAL_STORAGE_KEY = 'wormhole-sends'

const wormholeTokenAddress = '0x17F558795bEf05FFd2cB816e29ddD25e5381974b'

interface WormholeSend {
  receiver: Address
  amount: string
  burnAddress: string
  secret: string
  transactionHash: string
  used: boolean
}

const wormholeTokenAbi = [
  ...erc20Abi,
  {
    type: 'function',
    name: 'verifyAndMint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'root', type: 'bytes32' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

const prover = new Prover('wormhole')

function App() {
  const wagmiConfig = useConfig()
  const publicClient = usePublicClient()
  const { mutateAsync: writeContractAsync } = useWriteContract()

  const [sends, setSends] = useState<WormholeSend[]>([])
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [provingIndex, setProvingIndex] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadSends()
    prover.init()
  }, [])

  function setStatusMessage(msg: string, autoClear = false) {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
    setStatus(msg)
    if (autoClear) {
      statusTimeoutRef.current = setTimeout(() => setStatus(''), 5000)
    }
  }

  function loadSends() {
    const stored: WormholeSend[] = JSON.parse(
      localStorage.getItem(WORMHOLE_LOCAL_STORAGE_KEY) || '[]',
    )
    setSends(stored)
  }

  function createBurnAddress(receiver: Address) {
    const secret = bytesToBigInt(randomBytes(30))
    const burnAddress = toHex(toBytes(poseidon2([receiver, secret])).slice(12))
    return { secret, burnAddress }
  }

  async function sendWormholeToken(receiver: Address, tokenAmount: bigint) {
    setSendLoading(true)
    setStatusMessage('')

    const { secret, burnAddress } = createBurnAddress(receiver)
    const currentSends: WormholeSend[] = JSON.parse(
      localStorage.getItem(WORMHOLE_LOCAL_STORAGE_KEY) || '[]',
    )
    currentSends.push({
      receiver,
      amount: tokenAmount.toString(),
      burnAddress,
      secret: secret.toString(),
      transactionHash: '',
      used: false,
    })
    localStorage.setItem(
      WORMHOLE_LOCAL_STORAGE_KEY,
      JSON.stringify(currentSends),
    )
    setSends([...currentSends])

    try {
      const hash = await writeContractAsync({
        address: wormholeTokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [burnAddress, tokenAmount],
      })
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
      if (receipt.status === 'success') {
        const updatedSends: WormholeSend[] = JSON.parse(
          localStorage.getItem(WORMHOLE_LOCAL_STORAGE_KEY) || '[]',
        )
        const send = updatedSends.find((s) => isAddressEqual(s.burnAddress as Address, burnAddress))
        if (send) {
          send.transactionHash = hash
          localStorage.setItem(
            WORMHOLE_LOCAL_STORAGE_KEY,
            JSON.stringify(updatedSends),
          )
          setSends([...updatedSends])
        }
        setRecipientAddress('')
        setAmount('')
        setStatusMessage('Send successful!', true)
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Send failed: ' + (error as Error).message, true)
      currentSends.pop()
      localStorage.setItem(
        WORMHOLE_LOCAL_STORAGE_KEY,
        JSON.stringify(currentSends),
      )
      setSends([...currentSends])
    } finally {
      setSendLoading(false)
    }
  }

  async function verifyAndMintToken(send: WormholeSend, sendIndex: number) {
    if (!publicClient) {
      setStatusMessage('No public client available. Is your wallet configured?', true)
      return
    }

    setProvingIndex(sendIndex)
    setStatusMessage('Fetching transfer events...')

    try {
      // Reconstruct the on-chain Merkle tree from Transfer events
      const logs = await publicClient.getContractEvents({
        address: wormholeTokenAddress,
        abi: erc20Abi,
        eventName: 'Transfer',
        fromBlock: 24472870n,
      })

      const leaves = logs
        .filter(
          (log) =>
            log.args.to &&
            log.args.to !== '0x0000000000000000000000000000000000000000',
        )
        .map((log) => poseidon2([BigInt(log.args.to!), log.args.value!]))

      const tree = createMerkleTree(leaves)

      const ourLeaf = poseidon2([BigInt(send.burnAddress), BigInt(send.amount)])
      const leafIndex = tree.indexOf(ourLeaf)
      if (leafIndex === -1) throw new Error('Leaf not found in merkle tree')

      const proof = tree.generateProof(leafIndex)

      // Generate the ZK proof
      setStatusMessage('Generating ZK proof (this may take a moment)...')
      const proofData = await prover.prove({
        secret: send.secret,
        receiver: BigInt(send.receiver).toString(),
        amount: send.amount,
        merkle_root: proof.root.toString(),
        merkle_path: proof.siblings.map((p) => p.toString()).concat(Array(20 - proof.siblings.length).fill('0')),
        merkle_index: proof.index.toString(),
      })

      const nullifier = proofData.publicInputs[3] as `0x${string}`
      const rootHex = toHex(proof.root, { size: 32 })

      // Submit the on-chain verification + mint transaction
      setStatusMessage('Submitting transaction...')
      const hash = await writeContractAsync({
        address: wormholeTokenAddress,
        abi: wormholeTokenAbi,
        functionName: 'verifyAndMint',
        args: [
          send.receiver,
          BigInt(send.amount),
          rootHex,
          nullifier,
          toHex(proofData.proof),
        ],
      })

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
      if (receipt.status === 'success') {
        // Mark the send as used in localStorage
        const currentSends: WormholeSend[] = JSON.parse(
          localStorage.getItem(WORMHOLE_LOCAL_STORAGE_KEY) || '[]',
        )
        const sendToUpdate = currentSends.find(
          (s) => s.burnAddress === send.burnAddress,
        )
        if (sendToUpdate) {
          sendToUpdate.used = true
          localStorage.setItem(
            WORMHOLE_LOCAL_STORAGE_KEY,
            JSON.stringify(currentSends),
          )
          setSends([...currentSends])
        }
        setStatusMessage('Verify & mint successful!', true)
      }
    } catch (error) {
      console.error(error)
      setStatusMessage(
        'Verify & mint failed: ' + (error as Error).message,
        true,
      )
    } finally {
      setProvingIndex(null)
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!recipientAddress || !amount) return
    sendWormholeToken(recipientAddress as Address, parseEther(amount))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wormhole Token</h1>
        <ConnectKitButton />
      </header>

      <section className="card">
        <h2>Send Wormhole Token</h2>
        <form onSubmit={handleSend} className="send-form">
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={sendLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount (WHT)</label>
            <input
              id="amount"
              type="text"
              placeholder="1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={sendLoading}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={sendLoading || !recipientAddress || !amount}
          >
            {sendLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Wormhole Sends</h2>
        {sends.length === 0 ? (
          <p className="empty-state">No sends yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="sends-table">
              <thead>
                <tr>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Burn Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sends.map((send, i) => (
                  <tr key={send.burnAddress}>
                    <td title={send.receiver}>
                      {send.receiver.slice(0, 6)}...{send.receiver.slice(-4)}
                    </td>
                    <td>{formatEther(BigInt(send.amount))} WHT</td>
                    <td title={send.burnAddress}>
                      {send.burnAddress.slice(0, 6)}...
                      {send.burnAddress.slice(-4)}
                    </td>
                    <td>
                      <span
                        className={`badge ${send.used ? 'badge-used' : send.transactionHash ? 'badge-ready' : 'badge-pending'}`}
                      >
                        {send.used
                          ? 'Used'
                          : send.transactionHash
                            ? 'Ready'
                            : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {!send.used && send.transactionHash && (
                        <button
                          className="btn-verify"
                          onClick={() => verifyAndMintToken(send, i)}
                          disabled={provingIndex !== null}
                        >
                          {provingIndex === i ? 'Proving...' : 'Verify & Mint'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {status && (
        <div
          className={`status-bar ${status.toLowerCase().includes('failed') ? 'status-error' : status.toLowerCase().includes('successful') ? 'status-success' : 'status-info'}`}
        >
          {status}
        </div>
      )}
    </div>
  )
}

export default App
