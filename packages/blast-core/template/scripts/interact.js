const bre = require('cudos-blast')

async function main() {
  const [alice, bob] = await bre.getSigners()
  const contract = await bre.getContractFromAddress('cudos1uul3yzm2lgskp3dxpj0zg558hppxk6pt8t00qe', bob)

  const QUERY_GET_COUNT = { get_count: {} }
  let count = await contract.query(QUERY_GET_COUNT)
  console.log('Initial count: ' + count.count)

  const MSG_INCREMENT = { increment: {} }
  const result = await contract.execute(MSG_INCREMENT)
  console.log(result)

  count = await contract.query(QUERY_GET_COUNT, alice)
  console.log('Count after increment: ' + count.count)
}

module.exports = {
  main: main
};
