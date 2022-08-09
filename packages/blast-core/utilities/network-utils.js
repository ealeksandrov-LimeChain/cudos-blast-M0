const {
  CosmWasmClient,
  DirectSecp256k1HdWallet,
  SigningCosmWasmClient
} = require('cudosjs')
const { localNetwork } = require('../config/blast-constants')
const {
  getNetwork,
  getAddressPrefix
} = require('./config-utils')
const {
  getLocalAccounts,
  getPrivateAccounts
} = require('./account-utils')
const BlastError = require('./blast-error')

const nodeUrl = getNetwork(process.env.BLAST_NETWORK)

async function getSigner(mnemonic) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: getAddressPrefix() })
  const signer = await SigningCosmWasmClient.connectWithSigner(nodeUrl, wallet)
  const address = (await wallet.getAccounts())[0].address
  signer.address = address
  return signer
}

async function getDefaultSigner() {
  const accounts = getAccounts(nodeUrl)
  if (!accounts[0]) {
    throw new BlastError('Cannot get default signer. First account from accounts file is missing')
  }
  return getSigner(nodeUrl, accounts[0].mnemonic)
}

function getAccounts() {
  return (nodeUrl === localNetwork ? getLocalAccounts() : getPrivateAccounts())
}

async function getContractInfo(contractAddress) {
  const client = await CosmWasmClient.connect(nodeUrl)
  try {
    return client.getContract(contractAddress)
  } catch (error) {
    throw new BlastError(`Failed to get contract info from address: ${contractAddress}. Error: ${error.message}`)
  }
}

module.exports = {
  getSigner: getSigner,
  getDefaultSigner: getDefaultSigner,
  getAccounts: getAccounts,
  getContractInfo: getContractInfo
}
