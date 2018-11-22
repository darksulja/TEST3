load('/opt/evertz/mediator/lib/js/shellfun.js');

function getTime(){
	return wscall(<PharosCs>
				      <CommandList>
					      <Command subsystem="clock" method="getTime"/>
					  </CommandList>
				  </PharosCs>)..Output.Date;
}

function getSystemInfo() {
	return wscall(<PharosCs>
			  <CommandList>
				<Command subsystem="configuration" method="getSystemInfo"/>
			  </CommandList>
			</PharosCs>)..Output;
}

for (i = 0; i < 12; i++){
	append(getTime(), '/srv/dc-isilon/architectureTest/test_file');
	print(getSystemInfo()..CurrentDb);
	
	sleep(5);
}