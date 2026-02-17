import { poseidon2 } from 'poseidon-lite'
import { LeanIMT } from '@zk-kit/lean-imt'

function hashLeaves(a: bigint, b: bigint) {
  return poseidon2([a, b])
}

export function createMerkleTree(leaves: bigint[]) {
  const tree = new LeanIMT(hashLeaves, leaves)
  return tree
}