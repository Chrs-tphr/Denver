aa.print("Loading INCLUDES_CUSTOM_LICENSES")

function checkForProximityIssue_EL(service, distance){
	issueFound = false
	defaultMsg = "This location is within " + distance + "ft of "
	layers = []; attrByLayer = []
	
	// E and L GIS Attribute to lookup by Layer
	attrByLayer["Denver Public Schools K12"] = "SCH_NAME"
	attrByLayer["Denver Public School Areas K12"] = "OWNER_NAME"
	attrByLayer["Private Schools K12"] = "SCH_NAME"
	attrByLayer["Private School Areas K12"] = "OWNER_NAME"
	attrByLayer["Active Child Care Facilities"] = "BUS_PROF_NAME"
	attrByLayer["Active Marijuana Licenses"] = "BUS_PROF_NAME"
	attrByLayer["Active Liquor Licenses"] = "BUS_PROF_NAME"
	
	for (a in arguments) {
		if (a > 1) layers.push(""+arguments[a])
	}
	for (l in layers) {
		thisIssue = []
		thisAttr = ""+attrByLayer[layers[l]]
		if (thisAttr == "undefined"){
			logDebug("Undefined attribute for Layer: " + layers[l] + " -- function checkProximity_EL(service, distance)")
			continue
		}
		thisBuffer = getGISBufferInfo(service,layers[l],distance,thisAttr)
		for ( i in thisBuffer ) thisIssue.push(""+thisBuffer[i][thisAttr])
		if (thisIssue.length > 0) {
			issueFound = true; showMessage = true;
			logMessage(defaultMsg + thisIssue.length + " '" + layers[l] + "': " + thisIssue.join(", "))
		}
	}
	return issueFound
}

function sendSurveyMonkeyNotification() {	

     var reportName = "E & L Survey Monkey";
	 var parameters = aa.util.newHashMap(); parameters.put("CurrentUser", "133906"); 
	 
     report = aa.reportManager.getReportModelByName(reportName);	 
	 report = report.getOutput(); 
	 
	 var fromAddress = "AccelaDev@denvergov.org";
	 var toAddress = "Darren.Russell@denvergov.org";
	 var ccAddress = "";
	 var reportSubject = "EXCISE & LICENSES CUSTOMER SERVICE SURVEY";
	 
	 var permit = aa.reportManager.hasPermission(reportName,"ADMIN");
	 var message = "";
	 
	 if (permit.getOutput().booleanValue()) {
       var reportResult = aa.reportManager.runReport(parameters, report);
       var reportOutput = reportResult.getOutput();

       showMessage = true;
       showDebug = false;
			
       message += reportOutput;
			 
	   var sendResult = aa.sendMail(fromAddress,toAddress,ccAddress,reportSubject,message);			
    }
	if(sendResult.getSuccess()) {  
			logDebug("A copy of this report has been sent to the valid email addresses."); 
    } 
	else {
		   logDebug("System failed send report."); 
	}
}

function closeELRenewalTasks(childCapId, ApplicationStatus) {

    var tasks = aa.workflow.getTasks(childCapId).getOutput();
    for (y in tasks) {

        if (tasks[y].getActiveFlag() == "Y") {

            closeTask(tasks[y].getTaskDescription(), applicationStatus, "", "");
        }
    }
    updateAppStatus(applicationStatus, "")
}

function deactivateELTasks(capId, applicationStatus) {

    var tasks = aa.workflow.getTasks(capId).getOutput();
    for (y in tasks) {

        if (tasks[y].getActiveFlag() == "Y") {

            deactivateTask(tasks[y].getTaskDescription());
        }
    }
    updateAppStatus(applicationStatus, "")
}

function ELSurrenderRenewal(capId, applicationStatus) {
	
	if(capId == null || capId == "")
    return;
	
	showMessage = true
	renewalCapId = [];
	
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	   
	try{
		var SQL = "select c.b1_alt_id as renewalid from b1permit a, xapp2ref b, b1permit c where a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_master_id1 and a.b1_per_id2 = b.b1_master_id2 and a.b1_per_id3 = b.b1_master_id3 and b.b1_master_id1 || '-' || b.b1_master_id2 || '-' || b.b1_master_id3 = ? and b.b1_per_id1 = c.b1_per_id1 and b.b1_per_id2 = c.b1_per_id2 and b.b1_per_id3 = c.b1_per_id3"
		var dbStmt = conn.prepareStatement(SQL);
		dbStmt.setString(1,capId);
		dbStmt.executeQuery();
		results = dbStmt.getResultSet();
		while (results.next()) {
			renewalCapId.push(results.getString("renewalid"))
		}
		dbStmt.close();
	}
	catch(err) {
		logDebug(err.message); 
		if (typeof dbStmt != "undefined") dbStmt.close();
		}
		conn.close()
	
	var capIdObj = aa.cap.getCapID(renewalCapId[0]);
	var renCapId = capIdObj.getOutput();
	
	if (capIdObj.getSuccess()) {
		renCapId = capIdObj.getOutput();	
		 var tasks = aa.workflow.getTasks(renCapId).getOutput();
         for (y in tasks) {
		   var stepnumber = tasks[y].getStepNumber();
		   var processID = tasks[y].getProcessID();
		   var dispositionDate = aa.date.getCurrentDate();
		   var wfstat = "NA";
		   aa.workflow.handleDisposition(renCapId,stepnumber,processID,wfstat,dispositionDate, "Updated via script.","Parent License " + applicationStatus,systemUserObj ,"Y");
           }
        updateAppStatus(applicationStatus, "", renCapId)			
	}
}


function getContactEmails_EL() {
	emailList = []
	capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess()) {
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts) {
			thisConType = ""+Contacts[yy].getCapContactModel().getPeople().getContactType()
			if (thisConType == "Applicant" || thisConType == "Responsible Party") {
				tmpEmail = ""+Contacts[yy].getEmail()
				if (tmpEmail.indexOf("@") > 0 ) emailList.push(tmpEmail)
			}
		}
	}
	return emailList
}