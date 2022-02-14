const fsExtra = require('fs-extra')
const process = require('process')
const path = require('path')
const BlastError = require('./blast-error')

let config = {}

const configPath = path.join(process.cwd(), 'blast.config.js')
const accountsPath = path.join(process.cwd(), 'accounts.json')

function getConfig() {
  if (!fsExtra.pathExistsSync(configPath)) {
    throw new BlastError(`Config file was not found! Make sure that blast.config.js exists at ${configPath}`)
  }
  config = require(configPath)
  return config
}

function getAccountByName(name) {
  if (!fsExtra.pathExistsSync(accountsPath)) {
    throw new BlastError(`Accounts file was not found! Make sure that accounts.js exists at ${accountsPath}`)
  }
  const accounts = JSON.parse(JSON.stringify(require(accountsPath)))
  if (typeof accounts[name] !== 'undefined') {
    return accounts[name]
  }
  // TODO: handle user custom account
}

function getNetworkUrl() {
  const { config } = getConfig()

  if (!config.networkUrl) {
    throw new BlastError('Missing networkUrl in the config file.')
  }
  return config.endpoint
}

function getGasPrice() {
  const { config } = getConfig()

  if (!config.gasPrice) {
    throw new BlastError('Missing gasPrice in the config file.')
  }
  return config.gasPrice
}

async function getAddressPrefix() {
  const { config } = await getConfig()

  if (!config.addressPrefix) {
    throw new BlastError('Missing network in the config file.')
  }

  return config.addressPrefix
}

async function getDefaultAccount() {
  const { config } = await getConfig()

  if (!config.defaultAccount) {
    throw new BlastError('Missing defaultAccount in the config file.')
  }

  return config.defaultAccount
}

function getAdditionalAccounts() {
  const { config } = getConfig()
  return config.additionalAccounts
}

function getAdditionalAccountsBalances() {
  const { config } = getConfig()

  if (!config.customAccountBalances) {
    throw new BlastError('Missing [customAccountBalances] in the config file.')
  }
  return config.customAccountBalances
}

module.exports = {
  getAccountByName: getAccountByName,
  getNetworkUrl: getNetworkUrl,
  getGasPrice: getGasPrice,
  getAddressPrefix: getAddressPrefix,
  getDefaultAccount: getDefaultAccount,
  getAdditionalAccounts: getAdditionalAccounts,
  getAdditionalAccountsBalances: getAdditionalAccountsBalances
}