# Cudos Blast

Cudos Blast is a Node.js CLI (command line interface) tool for working with the Cudos blockchain. You can scaffold, compile and test your **Rust** smart contracts. JavaScript and Rust testing is supported.
Utilizing `blast.config.js` it provides a possibility for deploying and interacting with them on a specified network (local, test or public).
By using this tool you can also spin up a local [`Cudos node`](https://github.com/CudoVentures/cudos-node) and interact with it.

## Table of Contents

* [Installation](#installation) 
* [Help and version](#help-and-version) 
* [Initializing a project](#initializing-a-project) 
* [Compiling smart contracts](#compiling-smart-contracts) 
* [Running Rust tests](#running-rust-tests) 
* [Testing contracts with JavaScript](#testing-contracts-with-javascript) 
* [Interacting with a Cudos node](#interacting-with-a-cudos-node) 
  * [Starting a local node](#starting-a-local-node) 
  * [Stopping a running local node](#stopping-a-running-local-node) 
  * [Checking node status](#checking-node-status) 
* [Deploying smart contracts, interacting with them and running custom script files](#deploying-smart-contracts-interacting-with-them-and-running-custom-script-files) 
  * [Available functions in global context](#available-functions-in-global-context)
  * [Exposed functions of a contract instance](#exposed-functions-of-a-contract-instance)
  * [Additional options](#additional-options)
* [Network](#network)
  * [Localhost](#localhost)
  * [Testnet](#testnet)
  * [Mainnet](#mainnet)
* [Managing accounts](#managing-accounts) 
  * [Listing local node accounts](#listing-local-node-accounts) 
  * [Adding a new local node account](#adding-a-new-local-node-account) 
  * [Removing an existing local node account](#removing-an-existing-local-node-account) 
  * [Funding an existing local node account](#funding-an-existing-local-node-account) 

## Installation

Make sure you have [Node.js](https://nodejs.org/en/download/package-manager/) installed.  [Docker](https://docs.docker.com/engine/install) is also required.

| Prerequisite   | Minimum version | Recommended version |
| ---            | ---             | ---                 |
| Node.js        | 12.5.0          | 16.10.0             |
| npm            | 6.9.0           | 7.24.0              |
| Docker engine  | 19.03.13        | 20.10.12            |
| Docker compose | 1.27.4          | 1.29.2              |  

> For Windows users we recommend using Windows Subsystem for Linux ([WSL](https://docs.microsoft.com/en-us/windows/wsl/install-manual#downloading-distros)).
> To avoid permission issues with `WSL`, you may have to [change](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally#manually-change-npms-default-directory) `npm` default directory. 

Install Cudos Blast package:

```bash
npm install cudos-blast
```

Install Cudos Blast globally:

```bash
npm install -g cudos-blast
```

---
## Help and version

Run `--help` or `help` on any `blast` command to show all available subcommands, parameters and additional information. 

```bash
blast --help
blast help
blast node --help
blast node start help
```

You can display `cudos-blast` version number using `--version`.

```bash
blast --version
```

---

## Initializing a project

To scaffold a sample project navigate to empty directory and run

```bash
blast init
```

You can also specify the full directory of the project using optional parameter `--dir` or `-d`

```bash
blast init --dir /Your/Location/Here
```

The project is now ready to work with the Cudos blockchain. It contains sample smart contracts and scripts to deploy or interact.  
> Make sure to initialize a new project in a directory other than the local repository folder, or else `cudos-blast` will break and the repository have to be cloned again.  
> Also, all `blast` commands are designed to be executed from the project root directory.

---
## Compiling smart contracts

To compile all smart contracts run

```bash
blast compile
```

The contracts have to be in `{project_root}/contracts/` folder. Cudos Blast comes with sample contracts you can use. All contracts are compiled in alphabetical order and as a Rust workspace. If you want to add more folders to compile, all you have to do is edit the base `{project_root}/Cargo.toml` file and add your folder under `members`. The compilation is done using [rust-optimizer](https://github.com/CosmWasm/rust-optimizer) and the artifacts in `{project_root}/artifacts/` folder are optimized for deployment.

---
## Running Rust tests

Rust tests are organized by the Rust convention for writing tests. You can check them in their corresponding contracts in `{project_root}/contracts/{contract_name}/`. To run smart contracts' Rust tests:

```bash
blast rusttest
```

To run the Rust tests without printing cargo log messages use `--quiet` or `-q`

```bash
blast rusttest -q
```

---
## Testing contracts with JavaScript

Cudos Blast uses [Jest](https://jestjs.io) framework for testing. Test files must be in `{project_root}/tests/` folder. You can use the provided sample test as a template or make one or more tests of your own. You can run the [default local node](#starting-a-local-node) in order to deploy or interact with the smart contracts in your tests. To connect to a non-local Cudos node such as testnet or your own node, follow these [instructions](#network).

```bash
describe('alpha contract', () => {
  const MSG_INIT = { count: 13 }
  const MSG_INCREMENT = { increment: {} }
  const MSG_RESET = { reset: { count: 1 } }
  const QUERY_GET_COUNT = { get_count: {} }

  let alice, bob, contract

  // deploying alpha contract once before test cases
  beforeAll(async () => {
    // function 'getSigners' is available in global context
    [alice, bob] = await getSigners()
    contract = await getContractFactory('alpha')
    await contract.deploy(MSG_INIT, bob)
  })

  // positive test case
  test('increment count', async () => {
    await contract.execute(MSG_INCREMENT, alice)
    return expect(contract.query(QUERY_GET_COUNT))
      .resolves.toEqual({ count: 14 })
  })

  // ...

  // negative test case
  test('reset count from user throws unauthorized', () => {
    return expect(contract.execute(MSG_RESET, alice))
      .rejects.toThrow('Unauthorized')
  })
})
```

Run all test files with

```bash
blast test
blast test -n testnet
```

---
## Interacting with a Cudos node

You can interact with a local [`Cudos node`](https://github.com/CudoVentures/cudos-node) with `blast node` command.

### Starting a local node

To start a fresh local Cudos node run

```bash
blast node start
```

or you can show the node logging output in current terminal window. To do this use `--log` or `-l`.

```bash
blast node start -l
```

To see how to manage local node accounts go [here](#managing-accounts).

### Stopping a running local node

To stop a running node run

```bash
blast node stop
```

### Checking node status

To check whether any Cudos node is online or offline run

```bash
blast node status
blast node status -n testnet
```

More information about connecting to a non-local Cudos node [here](#network).

---
## Deploying smart contracts, interacting with them and running custom script files

You can use the supplied `{project_root}/scripts/deploy.js` to deploy a sample smart contract.

```bash
async function main () {
  // functions such as 'getSigners' and 'getContractFactory' are available in global context
  const [alice, bob] = await bre.getSigners()

  // get contract object of 'alpha' contract in 'contracts/alpha'
  const contract = await bre.getContractFactory('alpha')

  // define instantiate message for the contract
  // in this message you can set called function and its parameters
  const MSG_INIT = { count: 13 }

  // deploying the contract with bob as a signer (default signer would be alice)
  const deploy = await contract.deploy(MSG_INIT, { signer: bob })

  // get useful info such as contractAddress from deploy transaction
  const contractAddress = deploy.initTx.contractAddress

  // printing contract address so it can be copied and used in other scripts such as interact.js
  console.log(`Contract deployed at: ${contractAddress}`)
}
// ...
```

Deploy the contract by running the script:

```bash
blast run scripts/deploy.js
```

When the contract is deployed, its address will be printed. Then you can edit `{project_root}/scripts/interact.js` with the new address

```bash
async function main() {
  const [alice, bob] = await bre.getSigners()

  // replace the address with the new one from your deployed smart contract
  const contract = await bre.getContractFromAddress('cudos1uul3yzm2lgskp3dxpj0zg558hppxk6pt8t00qe', bob)
// ...
```

and run the script to interact with the deployed smart contract.

```bash
blast run scripts/interact.js
```

When running scripts through `blast run` the `bre` object in injected. It provides various useful functions to interact with cudos blockchain network. You can also `require` the `cudos-blast` library to access the same functions.

```bash
const bre = require('cudos-blast')
```

You are free to use these sample files as templates or create your own custom `.js` scripts. You can specify your own script file path. 

```bash
blast run scripts/myCustomScript.js
blast run newFolder/anotherScripts/myCustomScript.js
```

### Available functions in global context

Here is a list of functions you can use in your scripts.

| Function                                                     | Descripton                                                                                                                                                                                                                                                                           | Sample usage                                                                                      |
| ---                                                          | ---                                                                                                                                                                                                                                                                                  | ---                                                                                               |
| async getSigners()                                           | If the local node is used: Returns an array of predefined accounts (`{project_root}/local-accounts.json`) including the auto generated additional accounts.)<br />For other networks: returns an array of user-defined private accounts from `{project_root}/private-accounts.json`. | const [alice, bob] = await bre.getSigners()                                                       |
| async getContractFactory(contractLabel, signer = null)       | Returns an instance of a new contract by its label. A custom signer can be set. Default signer is the first account from `{project_root}/local-accounts.json`                                                                                                                        | const contract = await bre.getContractFactory('alpha', alice)                                     |
| async getContractFromAddress(contractAddress, signer = null) | Returns an instance of an existing contract by its address. A custom signer can be set. Default signer is the first account from `{project_root}/local-accounts.json`                                                                                                                | const contract = await bre.getContractFromAddress('cudos1uul3yzm2lgskp3dxpj0zg558hppxk6pt8t00qe') |

You can get an instance of a contract (e.g. with `getContractFactory()`). Here is the functionality such an instance of a contract can offer. 

### Exposed functions of a contract instance

| Function                                                            | Descripton                                                                                                                                                                                                                                                                                      | Sample usage                                                         |
| ---                                                                 | ---                                                                                                                                                                                                                                                                                             | ---                                                                  |
| async deploy(initMsg, signer = undefined, label = undefined, funds) | Deploys the conttract with the given `initMsg`. Optionally you can deploy with a signer and label other than the default ones. The deployer will become the default signer for the contract. You can also pass funds to automatically add selected amount of cudos to a contract on deployment. | const deploy = await contract.deploy(MSG_INIT, undefined, 'myLabel') |
| async execute(msg, signer = undefined)                              | Executes a transaction within the contract with the given message. Optionally you can execute with a signer other than the deployer.                                                                                                                                                            | const result = await contract.execute(MSG_INCREMENT)                 |
| async query(queryMsg, signer = undefined)                           | Executes a query within the contract with the given message. Optionally you can make a query with a signer other than the deployer.                                                                                                                                                             | const count = await contract.query(QUERY_GET_COUNT)                  |
| getAddress()                                                        | Returns the address of a deloyed contract or `null` if the contract is not deployed.                                                                                                                                                                                                            | const address = contract.getAddress()                                |

### Additional options

* You can run your scripts on a different node. More information [here](#network)
* You can set a custom address prefix under `addressPrefix` in `blast.config.js`. The default prefix is `cudos`

```bash
blast run scripts/myCustomScript.js -n testnet
```

* You can automatically fund smart contracts with tokens in your scripts

```bash
const { coin } = require('@cosmjs/stargate')

async function main () {
  const [alice, bob] = await getSigners()
  const contract = await getContractFactory('alpha')
  const MSG_INIT = { count: 13 }

  const tokens = [coin(321, "acudos")]
  const deploy = await contract.deploy(MSG_INIT, bob, 'alpha', tokens)
  // ...
```

---
## Network

You can connect to the default local node as well as a public one or you can use your own Cudos node. To do that, add a `{custom_name}: {node_url}` to `networks` field in `blast.config.js`, then call the `run`, `test` or `node status` command with `--network` or `-n` followed by `{custom_name}`. If no network is passed, blast commands connect to the default local node.  
Here are Cudos nodes you can use to connect to Cudos network:

### Localhost

| Chain ID      | URL                    |
| ---           | ---                    |
| cudos-network | http://localhost:26657 |

### Testnet

| Chain ID               | URL                                            |
| ---                    | ---                                            |
| cudos-testnet-public-2 | https://sentry1.gcp-uscentral1.cudos.org:36657 |

### Mainnet

| Chain ID | URL |
| ---      | --- |
|          |     |

---
## Managing accounts

By default local Cudos node starts with 10 predefined accounts funded with `acudos`. You can set how many additional random accounts to load when starting a local node in `blast.config.js` under `additionalAccounts`. If any additional accounts are added, `customAccountBalances` field must be set for the amount of tokens that these accounts will be funded with. Predefined and additionally generated accounts are written in `{project_root}/local-accounts.json`. Another way to manage custom accounts is through `blast keys` command.  
You can put your private accounts in `{project_root}/private-accounts.json`. Initializing a new project automatically adds this file to `.gitignore`. **Make sure you keep `private-accounts.json` in `.gitignore` in order to prevent accidentally committing and exposing your private accounts.** 

### Listing local node accounts

To list all accounts in the local node key storage run

```bash
blast keys ls
```

### Adding a new local node account

To add a new account named `myAccount1` to the local node key storage run
  
```bash
blast keys add myAccount1
```

After adding the new account, it is automatically funded with `acudos` tokens from the default local node faucet.

### Removing an existing local node account

To remove an account from the node key storage run

```bash
blast keys rm myAccount1
```

You can skip the delete confirmation with `--force` or `-f`

```bash
blast keys rm myAccount1 -f
```

---
### Funding an existing local node account

You can fund an account with additional tokens. To specify tokens amount use `--tokens` or `-t`.

```bash
blast keys fund myAccount1 --tokens 1000000
```

The tokens are funded from the default local node faucet in `acudos`.
