#!/bin/bash
BASE_PATH="/opt/evertz/mediator/lib/java/"
SHELL="org.mozilla.javascript.tools.shell.Main"
 
#Extra Path for Jars specific to GMO
GMO_JAR_PATH="/opt/evertz/mediator/etc/jars/"

#GMO Specific Jar List
GMO_COMM_DISC_JAR="commons-discovery-0.2.jar"

# Check Jars are there
if [ ! -f "${GMO_JAR_PATH}${GMO_COMM_DISC_JAR}" ]; then 
	echo -e "\nError could not find ${GMO_JAR_PATH}${GMO_COMM_DISC_JAR} Quitting...\n"
	exit 1
fi

#!/bin/bash
RHINO_CLASSPATH="\
${BASE_PATH}pox.jar:\
${BASE_PATH}log4j-1.2-api-2.5.jar:\
${BASE_PATH}log4j-slf4j-impl-2.7.jar:\
${BASE_PATH}log4j-jul-2.7.jar:\
${BASE_PATH}microtime-3.0.4.jar:\
${BASE_PATH}moxbannotations-0.50.jar:\
${BASE_PATH}appbase-0.6.0.jar:\
${BASE_PATH}pilotclient-1.0.jar:\
${BASE_PATH}joda-time-2.9.1.jar:\
${BASE_PATH}javax.servlet-api-3.1.0.jar:\
${BASE_PATH}commons-daemon-1.0.15.jar:\
${BASE_PATH}commons-beanutils-1.9.2.jar:\
${BASE_PATH}commons-collections-3.2.2.jar:\
${BASE_PATH}commons-collections4-4.0.jar:\
${BASE_PATH}commons-codec-1.10.jar:\
${BASE_PATH}commons-digester-2.1.jar:\
${BASE_PATH}commons-fileupload-1.3.1.jar:\
${BASE_PATH}commons-lang-2.6.jar:\
${BASE_PATH}commons-lang3-3.4.jar:\
${BASE_PATH}commons-io-2.4.jar:\
${BASE_PATH}spring-aop-4.3.2.RELEASE.jar:\
${BASE_PATH}javax.inject-1.jar:\
${BASE_PATH}spring-beans-4.3.2.RELEASE.jar:\
${BASE_PATH}spring-context-4.3.2.RELEASE.jar:\
${BASE_PATH}spring-core-4.3.2.RELEASE.jar:\
${BASE_PATH}spring-jdbc-4.2.3.RELEASE.jar:\
${BASE_PATH}spring-test-4.2.3.RELEASE.jar:\
${BASE_PATH}spring-tx-4.2.3.RELEASE.jar:\
${BASE_PATH}spring-webmvc-4.2.3.RELEASE.jar:\
${BASE_PATH}spring-web-4.2.3.RELEASE.jar:\
${BASE_PATH}spring-websocket-4.2.3.RELEASE.jar:\
${BASE_PATH}jna-4.2.1.jar:\
${BASE_PATH}argparse4j-0.4.4.jar:\
${BASE_PATH}asm-all-5.0.4.jar:\
${BASE_PATH}cglib-3.2.0.jar:\
${BASE_PATH}jackson-annotations-2.6.3.jar:\
${BASE_PATH}jackson-core-2.6.3.jar:\
${BASE_PATH}jackson-databind-2.6.3.jar:\
${BASE_PATH}gson-2.4.jar:\
${BASE_PATH}groovy-all-2.4.5.jar:\
${BASE_PATH}commons-net-3.3.jar:\
${BASE_PATH}commons-exec-1.3.jar:\
${BASE_PATH}super-csv-2.3.1.jar:\
${BASE_PATH}pharosutil-10023.jar:\
${BASE_PATH}bcpkix-jdk15on-1.52.jar:\
${BASE_PATH}bcprov-jdk16-1.46.jar:\
${BASE_PATH}argo-3.18.jar:\
${BASE_PATH}dom4j-1.6.1.jar:\
${BASE_PATH}xml-apis-1.4.01.jar:\
${BASE_PATH}xml-resolver-1.2.jar:\
${BASE_PATH}rhino-1.7.7.jar:\
${BASE_PATH}rfc2445-2007-01-18.jar:\
${BASE_PATH}guava-18.0.jar:\
${BASE_PATH}junit-4.12.jar:\
${BASE_PATH}commons-logging-1.2.jar:\
${BASE_PATH}commons-httpclient-3.1.jar:\
${BASE_PATH}httpcore-4.4.3.jar:\
${BASE_PATH}httpcore-nio-4.4.3.jar:\
${BASE_PATH}httpclient-4.5.jar:\
${BASE_PATH}tritonus-share-0.3.7-1.jar:\
${BASE_PATH}mp3spi-1.9.5-1.jar:\
${BASE_PATH}axis-1.4.jar:\
${BASE_PATH}axis2-1.4.1.jar:\
${BASE_PATH}axiom-impl-1.2.7.jar:\
${BASE_PATH}axiom-dom-1.2.7.jar:\
${BASE_PATH}slf4j-api-1.7.21.jar:\
${BASE_PATH}axiom-api-1.2.7.jar:\
${BASE_PATH}wsdl4j-1.6.2.jar:\
${BASE_PATH}jbaton-1.0.jar:\
${BASE_PATH}aspera-faspmanager-3.1.0.65760.jar:\
${BASE_PATH}xmlrpc-client-3.1.jar:\
${BASE_PATH}jboss-jaxrpc-4.2.3.GA.jar:\
${BASE_PATH}jetty-server-9.3.6.v20151106.jar:\
${BASE_PATH}jetty-http-9.3.6.v20151106.jar:\
${BASE_PATH}jetty-util-9.3.6.v20151106.jar:\
${BASE_PATH}jetty-io-9.3.6.v20151106.jar:\
${BASE_PATH}log4j-core-2.7.jar:\
${BASE_PATH}aopalliance-1.0.jar:\
${BASE_PATH}spring-expression-4.3.2.RELEASE.jar:\
${BASE_PATH}ant-1.9.4.jar:\
${BASE_PATH}ant-launcher-1.9.4.jar:\
${BASE_PATH}bcprov-jdk15on-1.52.jar:\
${BASE_PATH}hamcrest-core-1.3.jar:\
${BASE_PATH}xalan-2.7.2.jar:\
${BASE_PATH}serializer-2.7.2.jar:\
${BASE_PATH}xercesImpl-2.11.0.jar:\
${BASE_PATH}jlayer-1.0.1-1.jar:\
${BASE_PATH}log4j-api-2.7.jar:\
${BASE_PATH}geronimo-activation_1.1_spec-1.0.1.jar:\
${BASE_PATH}geronimo-javamail_1.4_spec-1.2.jar:\
${BASE_PATH}jaxen-1.1.1.jar:\
${BASE_PATH}geronimo-stax-api_1.0_spec-1.0.1.jar:\
${BASE_PATH}wstx-asl-3.2.4.jar:\
${BASE_PATH}ws-commons-util-1.0.2.jar:\
${BASE_PATH}xmlrpc-common-3.1.jar:\
${GMO_JAR_PATH}${GMO_COMM_DISC_JAR}\
"
echo -e "$RHINO_CLASSPATH"