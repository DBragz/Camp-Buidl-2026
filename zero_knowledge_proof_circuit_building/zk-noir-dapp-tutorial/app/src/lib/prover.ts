import { Noir, type InputMap, type CompiledCircuit } from "@noir-lang/noir_js";
import { Barretenberg, type ProofData, UltraHonkBackend } from "@aztec/bb.js";
import initNoirC from '@noir-lang/noirc_abi';
import initACVM from '@noir-lang/acvm_js';
import acvm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
import noirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';

export type CircuitType = "wormhole";

function getCircuitPath(type: CircuitType): string {
  return `../../artifacts/circuits/${type}.json`;
}

async function getCircuit(type: CircuitType): Promise<CompiledCircuit> {
  const importPath = getCircuitPath(type);
  const circuit = await import(importPath);
  return circuit as CompiledCircuit;
}

export class Prover {
  private _backend: UltraHonkBackend | undefined
  private _circuitType: CircuitType
  private _noir: Noir | undefined
  
  private _initialized = false
  
  constructor(circuit: CircuitType) {
    this._circuitType = circuit
  }
  
  get backend() {
    if (!this._backend) {
      throw new Error("Prover not initialized")
    }
    return this._backend
  }
  
  get noir() {
    if (!this._noir) {
      throw new Error("Prover not initialized")
    }
    return this._noir
  }
  
  async init() {
    if (this._initialized) return
    // Initialize WASM modules
    await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);
    const circuit = await getCircuit(this._circuitType)
    this._noir = new Noir(circuit)
    const api = await Barretenberg.new()
    this._backend = new UltraHonkBackend(circuit.bytecode, api)
    this._initialized = true
  }

  async prove(inputs: InputMap, options: { keccak: boolean } = { keccak: true }) {
    await this.init()
    const { witness } = await this.noir.execute(inputs)
    return await this.backend.generateProof(witness, options)
  }

  async verify(proof: ProofData, options: { keccak: boolean } = { keccak: true }) {
    await this.init()
    return await this.backend.verifyProof(proof, options)
  }
}