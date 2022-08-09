#!/bin/bash
source ./vars.sh

init_folder="$INIT_FOLDER-compile"
cp -R $PATH_TO_TEMPLATE $init_folder &> /dev/null
#manually supply the testing folder with local-accounts.json
cp -f $DEFAULT_ACCOUNTS_FILE_PATH "$init_folder/local-accounts.json"
cd $init_folder

echo -n 'blast compile...'

blast compile &> /dev/null
cd artifacts
if [[ `ls` == $COMPILE_FILES ]]; then
    echo -e $PASSED
else
    echo -e "$FAILED\nInvalid artifacts!" 1>&2
    exit_status=1
fi
cd ..

echo -n 'blast run sample deploy script...'
if [[ $exit_status == 1 ]]; then
    docker run --rm -v "`pwd`":/code  --mount type=volume,source="contracts_cache",target=/code/target --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry cosmwasm/workspace-optimizer:0.12.6 &> /dev/null
fi

if [[ `blast run ./scripts/deploy.js` =~ cudos([0-9]|[a-z])+ ]]; then
    echo -e $PASSED
    # get address from the previous command's regex matching
    address=${BASH_REMATCH[0]}
else
    echo -e $FAILED
    exit_status=1
    run_cmd_status=1
fi

# prevent other run commnds from executing if "blast run" fails
if [[ $run_cmd_status == 1 ]]; then
    rm -r -f ./$init_folder &> /dev/null || true
    exit $exit_status
fi

echo -n 'blast run sample interact script...'
# replace contract address in script
perl -pi -e "s|cudos1uul3yzm2lgskp3dxpj0zg558hppxk6pt8t00qe|${address}|" ./scripts/interact.js
if [[ `blast run ./scripts/interact.js` =~ 'Count after increment: 14' ]]; then
    echo -e $PASSED
else
    echo -e $FAILED
    exit_status=1
fi

# executing blast run on the local network through --network
echo -n 'blast run -n [network]...'
# Add localhost to [networks] in the config
perl -pi -e $'s|networks: {|networks: {\tlocalhost_test: \'http://localhost:26657\',|' blast.config.js
if [[ `blast run ./scripts/deploy.js -n localhost_test` =~ 'cudos' ]]; then
    echo -e $PASSED
else
    echo -e $FAILED
    exit_status=1
fi

echo -n 'deploy and fund contract...'

# tweak the deploy script to get cudos and pass it to the deploy function
perl -pi -e 's|{ signer: alice }|{ signer: alice, funds: 321}|' ./scripts/deploy.js


deployed_contract=`blast run ./scripts/deploy.js`
if [[ $deployed_contract =~ 'cudos' ]]; then
    echo -e $PASSED
else
    echo -e $FAILED
    exit_status=1
fi

echo -n 'verify contract balance...'
cd ..
contract_balance=`$LOCAL_NODE_EXEC cudos-noded q bank balances ${deployed_contract:22}`

if [[ $contract_balance =~ '321' ]]; then
    echo -e $PASSED
else
    echo -e $FAILED
    exit_status=1
fi

rm -r -f ./$init_folder &> /dev/null || true
exit $exit_status