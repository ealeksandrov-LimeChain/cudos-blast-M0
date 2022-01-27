#!/bin/bash
source ./packages/cudos-tests/integration-tests/vars.sh
init_folder="$INIT_FOLDER-unittest"

echo -n 'cudos unittest...'
cp -R template $init_folder &> /dev/null && cd $init_folder

result=`cudos unittest -q`
if [[ ! $result =~ $UNITTEST_RESULT ]]; then
    echo -e "$FAILED\n$EXPECTED\n$UNITTEST_RESULT\n$ACTUAL\n$result" 1>&2
    exit_status=1
else
    echo -e $PASSED
fi

rm -r ../$init_folder &> /dev/null
exit $exit_status