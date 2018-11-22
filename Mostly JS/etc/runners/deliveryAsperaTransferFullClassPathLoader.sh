

#!/bin/bash
RHINO_CLASSPATH=$(/opt/evertz/mediator/etc/runners/setRhinoClassPath.sh)

SHELL="org.mozilla.javascript.tools.shell.Main"


DELIVERY_TEST_SCRIPT=/opt/evertz/mediator/etc/runners/run_asperaDelivery.js
JS_DIR=/opt/evertz/mediator/lib/js/

echo -e "$RHINO_CLASSPATH"
echo -e "\nIn deliveryAsperaTransferFullClassPathLoader.sh Running ${DELIVERY_TEST_SCRIPT} \nArguments  are ${@}"


java -Dfile.encoding=utf-8 -cp "$RHINO_CLASSPATH" "$SHELL" "/opt/evertz/mediator/lib/js/wsshell.js" "$@" "$DELIVERY_TEST_SCRIPT" "$JS_DIR"
