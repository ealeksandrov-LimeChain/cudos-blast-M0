const {
  GasPrice,
  calculateFee,
  parseCoins
} = require('cudosjs')
const path = require('path')
const fs = require('fs')
const BlastError = require('../utilities/blast-error')
const { getProjectRootPath } = require('../utilities/package-info')
const { getGasPrice } = require('../utilities/config-utils')
const {
  getDefaultSigner,
  getContractInfo,
  getCodeDetails
} = require('../utilities/network-utils')
const {
  DEFAULT_DENOM,
  GAS_AUTO
} = require('../config/blast-constants')

function getGasFee(gasLimit, gasMultiplier) {
  if (!gasLimit || gasLimit === GAS_AUTO) {
    if (!gasMultiplier || gasMultiplier === GAS_AUTO) {
      return GAS_AUTO
    }
    return gasMultiplier
  }
  return calculateFee(gasLimit, GasPrice.fromString(getGasPrice()))
}

module.exports.CudosContract = class CudosContract {
  #label
  #wasmPath
  #codeId
  #contractAddress
  #creator

  static constructLocal(label) {
    const wasmPath = path.join(getProjectRootPath(), `artifacts/${label}.wasm`)
    if (!fs.existsSync(wasmPath)) {
      throw new BlastError(`Contract with label ${label} was not found. Only compiled contracts can be accepted`)
    }
    const cudosContract = new CudosContract()
    cudosContract.#wasmPath = wasmPath
    return cudosContract
  }

  static async constructUploaded(codeId) {
    const codeDetails = await getCodeDetails(codeId)
    const cudosContract = new CudosContract()
    cudosContract.#codeId = codeId
    cudosContract.#creator = codeDetails.creator
    return cudosContract
  }

  static async constructDeployed(contractAddress) {
    const contractInfo = await getContractInfo(contractAddress)
    const cudosContract = new CudosContract()
    cudosContract.#label = contractInfo.label
    cudosContract.#codeId = contractInfo.codeId
    cudosContract.#contractAddress = contractInfo.address
    cudosContract.#creator = contractInfo.creator
    return cudosContract
  }

  // Uploads the contract's code to the network
  async uploadCode(options = {
    signer: null, gasLimit: null, gasMultiplier: null
  }) {
    if (this.#isUploaded()) {
      throw new BlastError('Cannot upload contract that is already uploaded')
    }
    options.signer = options.signer ?? await getDefaultSigner()
    const uploadTx = await this.#uploadContract(options.signer, options.gasLimit, options.gasMultiplier)
    this.#codeId = uploadTx.codeId
    this.#creator = options.signer.address
    return uploadTx
  }

  // Instantiates uploaded code without assigning the new contract to current contract object instance
  async instantiate(msg, label, options = {
    signer: null, funds: null, gasLimit: null, gasMultiplier: null
  }) {
    if (!this.#isUploaded()) {
      throw new BlastError('Cannot instantiate contract that is not uploaded. ' +
        'Contract\'s code must exist on the network before instantiating')
    }
    if (options.funds) {
      options.funds = parseCoins(options.funds + DEFAULT_DENOM)
    }
    options.signer = options.signer ?? await getDefaultSigner()
    const instantiateTx = await this.#instantiateContract(options.signer, this.#codeId, msg, label, options.funds,
      options.gasLimit, options.gasMultiplier)
    return instantiateTx
  }

  // Uploads code, instantiates the contract and assign it to current contract object instance
  async deploy(msg, label, options = {
    signer: null, funds: null
  }) {
    if (this.#isUploaded()) {
      throw new BlastError('Cannot deploy contract that is already uploaded. Only new contracts can be deployed. ' +
        'Use "instantiate" for uploaded contracts')
    }
    if (options.funds) {
      options.funds = parseCoins(options.funds + DEFAULT_DENOM)
    }
    options.signer = options.signer ?? await getDefaultSigner()
    const uploadTx = await this.#uploadContract(options.signer, GAS_AUTO, GAS_AUTO)
    this.#codeId = uploadTx.codeId
    this.#creator = options.signer.address
    const instantiateTx = await this.#instantiateContract(options.signer, uploadTx.codeId, msg, label, options.funds,
      GAS_AUTO, GAS_AUTO)
    this.#contractAddress = instantiateTx.contractAddress
    this.#label = label
    return {
      uploadTx: uploadTx,
      instantiateTx: instantiateTx
    }
  }

  async execute(msg, signer = null, options = {
    gasLimit: null, gasMultiplier: null
  }) {
    if (!this.#isDeployed()) {
      throw new BlastError('Cannot use "execute()" on non-deployed contracts')
    }
    signer = signer ?? await getDefaultSigner()
    const fee = getGasFee(options.gasLimit, options.gasMultiplier)
    return signer.execute(signer.address, this.#contractAddress, msg, fee)
  }

  async query(msg, signer = null) {
    if (!this.#isDeployed()) {
      throw new BlastError('Cannot use "query()" on non-deployed contracts')
    }
    signer = signer ?? await getDefaultSigner()
    return signer.queryContractSmart(this.#contractAddress, msg)
  }

  getAddress() {
    if (!this.#isDeployed()) {
      return null
    }
    return this.#contractAddress
  }

  getCodeId() {
    if (!this.#isUploaded()) {
      return null
    }
    return this.#codeId
  }

  getLabel() {
    if (!this.#isDeployed()) {
      return null
    }
    return this.#label
  }

  getCreator() {
    if (!this.#isUploaded()) {
      return null
    }
    return this.#creator
  }

  async #uploadContract(signer, gasLimit, gasMultiplier) {
    const wasm = fs.readFileSync(this.#wasmPath)
    const uploadFee = getGasFee(gasLimit, gasMultiplier)
    return signer.upload(
      signer.address,
      wasm,
      uploadFee
    )
  }

  async #instantiateContract(signer, codeId, msg, label, funds, gasLimit, gasMultiplier) {
    const instantiateFee = getGasFee(gasLimit, gasMultiplier)
    return signer.instantiate(
      signer.address,
      codeId,
      msg,
      label,
      instantiateFee,
      { funds: funds }
    )
  }

  #isUploaded() {
    if (this.#codeId) {
      return true
    }
    return false
  }

  #isDeployed() {
    if (this.#contractAddress) {
      return true
    }
    return false
  }
}
