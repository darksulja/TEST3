importPackage(Packages.java.util);
importPackage(Packages.java.lang);
importPackage(Packages.javax.mail);
importPackage(Packages.javax.mail.internet);
importPackage(Packages.javax.activation);
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
output("Running run_SendCustomEmail.js");

try {

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
	
	var properties,session,message,multipart,messageBodyPart;
	var toAddress,senderAddress,subject,body;
	
	body = jobDescription..body.toString() ;
	subject = jobDescription..subject.toString();
	senderAddress = jobDescription..sender.toString();
	toAddress = jobDescription..address.toString();
	relayHost = jobDescription..mailrelay.toString();
	
	properties = System.getProperties();
	properties.setProperty("mail.smtp.host",relayHost);
	session = Session.getDefaultInstance(properties);

	print("\nRelay is ["+relayHost+"]");
	print("\nMediator Email Address is ["+senderAddress+"]");
	print("\nEmail Subject is ["+subject+"]");
	print("\nEmail To is ["+toAddress+"]");
	
	message = new MimeMessage(session)
	message.setFrom(new InternetAddress(senderAddress));
	message.setSubject(subject);
	
	var addressArray = [];
	toAddress = toAddress.split(';');
	for each (var address in toAddress){
		addressArray.push(new InternetAddress(address));
	}
	message.addRecipients(Message.RecipientType.TO,addressArray);

	//Setting HTML Content
	multipart = new MimeMultipart("related");
	messageBodyPart = new MimeBodyPart();
	messageBodyPart.setContent(body,"text/html");
	multipart.addBodyPart(messageBodyPart);
	
	//Setting GMO Logo
	messageBodyPart = new MimeBodyPart();
	//var dataSource = new FileDataSource('/usr/local/pharos/etc/mediator/gmo_logo_email.png'); 
	//messageBodyPart.setDataHandler(new DataHandler(dataSource));
	//messageBodyPart.setHeader("Content-ID","<image>");
	//messageBodyPart.setDisposition(MimeBodyPart.INLINE);
	//messageBodyPart.attachFile('/usr/local/pharos/etc/mediator/gmo_logo_email.png');
	//multipart.addBodyPart(messageBodyPart);
	
	message.setContent(multipart);
	
	print("\nSending Email");
	Transport.send(message); 
	print("\nEmailSent");
	
} catch(e) {
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});	
	quit(1);
}