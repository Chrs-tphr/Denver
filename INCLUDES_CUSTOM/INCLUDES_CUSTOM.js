/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|     available to all master scripts
|
| Notes   : 04/25/2016 - Godwin, Chris - added allScheduledROWInspAreApproved() to check scheduled ROW inspection statuses (TFS-29578)
|           03/30/2016 - Godwin, Chris - update processLogReviewTasks() to include new default SUDP Review status "Separate Submittal Required" (TFS-28103)
|           11/13/2015 - Russell, Darren - updated processLogReviewTasks to insert workflow activity on Resubmittal (TFS-21719)
|           10/26/2015 - Russell, Darren - created getNISInspId function to retrieve Inspection ID Number for use in obtaining Inspection API data. (TFS-25271)
|           10/24/2015 - Russell, Darren - created runSalesforceStatusSendAsync function to send closed/canceled statuses on SO and Graffiti SO records to Salesforce. (TFS-25175)
|           10/14/2015 - Passarelli, Gabe - Added function assessROWPublicWorksPermitFees to replace assessPublicWorksROWFees
|           08/14/2015 - Passarelli, Gabe - Set due dates for building log in function processLogReviewTasks (TFS-21068)
|           01-09-2015 - Russell, Darren - added new function to retrieve ActionBy on userdefined task for ROW/Vending Inspections
|           12-16-2014 - McDonald, Jason - merged the TEST and DEV files. Added all the new functions from 10/20 
|           11-20-2014 - Russell, Darren - Corrected Fee Code in TAPfees function
/------------------------------------------------------------------------------------------------------*/
emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput()
servProvCode = aa.getServiceProviderCode()

var includesList = ["INCLUDES_CUSTOM_CONTRACTORS", "INCLUDES_CUSTOM_DEVELOPMENT", "INCLUDES_CUSTOM_LICENSES", "INCLUDES_CUSTOM_ROW"]

for ( i in includesList ) { 
  thisInc = ""
  try {
    thisInc = ""+emseBiz.getScriptByPK(servProvCode,includesList[i],"ADMIN").getScriptText()
    eval(thisInc)
  } catch (err) {
    logDebug(includesList[i] + ": " + err)
  }
}


function daysBetween(date1, date2){
   if (typeof(date1) == "object") date1 = date1.toString(); //Added these because we can't always assume it's a string, ASIT dates are objects. 
   if (typeof(date2) == "object") date2 = date2.toString(); //
   if (date1.indexOf("-") != -1) { date1 = date1.split("-"); } else if (date1.indexOf("/") != -1) { date1 = date1.split("/"); } else { return 0; } 
   if (date2.indexOf("-") != -1) { date2 = date2.split("-"); } else if (date2.indexOf("/") != -1) { date2 = date2.split("/"); } else { return 0; } 
   if (parseInt(date1[0], 10) >= 1000) { 
       var sDate = new Date(date1[0]+"/"+date1[1]+"/"+date1[2]); 
   } else if (parseInt(date1[2], 10) >= 1000) { 
       var sDate = new Date(date1[2]+"/"+date1[0]+"/"+date1[1]); 
   } else { 
       return 0; 
   } 
   if (parseInt(date2[0], 10) >= 1000) { 
       var eDate = new Date(date2[0]+"/"+date2[1]+"/"+date2[2]);
   } else if (parseInt(date2[2], 10) >= 1000) { 
       var eDate = new Date(date2[2]+"/"+date2[0]+"/"+date2[1]); 
   } else {
       return 0; 
   } 
   var one_day = 1000*60*60*24;
   var daysApart = Math.abs(Math.ceil((sDate.getTime()-eDate.getTime())/one_day)); 
   return daysApart; 
}

// Added for purposes of getting parent license CAP expiration

function getParentLicenseCapID(itemCap)
{
       if (itemCap == null || aa.util.instanceOfString(itemCap))
       {
              return null;
       }
       
       var licenseCap = null;
       
       var result2 = aa.cap.getProjectByChildCapID(itemCap, "Renewal", null);
       if(result2.getSuccess())
              {
                     licenseProjects = result2.getOutput();
                     if (licenseProjects != null && licenseProjects.length > 0)
                     {
                     licenseProject = licenseProjects[0];
                     return licenseProject.getProjectID();
                     }
              }
 
       var result = aa.cap.getProjectByChildCapID(itemCap, "EST", null);
       if(result.getSuccess())
       {
              projectScriptModels = result.getOutput();
              if (projectScriptModels != null && projectScriptModels.length > 0)
              {
              projectScriptModel = projectScriptModels[0];
              licenseCap = projectScriptModel.getProjectID();
              return licenseCap;
              }
       }
       
 
       logDebug("**WARNING: Could not find parent license Cap for child CAP(" + itemCap + "): ");
                return false;
                
       
}

// Added for the Renewal Process to update Status of license CAP when renewal is Approved

function getParentCapIDForReview(capid)
{
  if (capid == null || aa.util.instanceOfString(capid))
  {
    return null;
  }
  //1. Get parent license for review
  var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Review");//"Incomplete" was"Review" was "Complete"
    if(result.getSuccess())
  {
    projectScriptModels = result.getOutput();
    if (projectScriptModels == null || projectScriptModels.length == 0)
    {
      logDebug("ERROR: Failed to get parent CAP with CAPID(" + capid + ") for review");
      return null;
    }
    //2. return parent CAPID.
    projectScriptModel = projectScriptModels[0];
    return projectScriptModel.getProjectID();
  }  
    else
       var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Complete");//"Incomplete" was"Review" was "Complete"
    if(result.getSuccess())
  {
    projectScriptModels = result.getOutput();
    if (projectScriptModels == null || projectScriptModels.length == 0)
    {
      logDebug("ERROR: Failed to get parent CAP with CAPID(" + capid + ") for review");
      return null;
    }
    //2. return parent CAPID.
    projectScriptModel = projectScriptModels[0];
    return projectScriptModel.getProjectID();
  }  

    else 
    {
      logDebug("ERROR: Failed to get parent CAP by child CAP(" + capid + ") for review: " + result.getErrorMessage());
      return null;
    }
}


//new for licensing 
function copyASIT(sourceCapId,targetCapId) { //optional tablenames to ignore

  var ignoreArray = new Array();
  for (var i=2; i<arguments.length;i++)
    ignoreArray.push(arguments[i])

  var gmRes = aa.appSpecificTableScript.getAppSpecificTableGroupModel(sourceCapId);
  if (gmRes.getSuccess()) {
    var gm = gmRes.getOutput();
    var ta = gm.getTablesArray()
    var tai = ta.iterator();
    while (tai.hasNext()) {
        var tsm = tai.next();
      var tm = tsm.getAppSpecificTableModel();
      var tName = tm.getTableName();
      if (!exists(tName,ignoreArray)) {
        var fieldArrList = tm.getTableField();
                          var fieldArr = fieldArrList.toArray();
                          var itemFound = false;
                          for (xx in fieldArr) {
                                fieldItem = fieldArr[xx];
                                if (!((fieldItem == null) || (fieldItem == undefined) || (fieldItem == "" ) || (fieldItem == "undefined"))) {
                                  itemFound = true;
            break;
              }
        }
        if (itemFound) {
          addTableFieldToASITable(tName, fieldArrList, targetCapId);
        }
      }
    }
  }
}
function addTableFieldToASITable(tableName,tableField) { // optional capId
  if (arguments.length > 2)
    itemCap = arguments[2]; 
  else
    return;

  var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

  if (!tssmResult.getSuccess())
    { logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

  var tssm = tssmResult.getOutput();
  var tsm = tssm.getAppSpecificTableModel();
  tsm.setTableField(tableField);
  if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null
  addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, "ADMIN");
  if (!addResult .getSuccess())
    { logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
  else
    logDebug("Successfully added record to ASI Table: " + tableName);

}

function getCapWorkDesModel(capId)
{
  capWorkDesModel = null;
  var s_result = aa.cap.getCapWorkDesByPK(capId);
  if(s_result.getSuccess())
  {
    capWorkDesModel = s_result.getOutput();
  }
  else
  {
    aa.print("ERROR: Failed to get CapWorkDesModel: " + s_result.getErrorMessage());
    capWorkDesModel = null; 
  }
  return capWorkDesModel;
}


function copyDetailedDescription(srcCapId, targetCapId)
{
    //1. Get CapWorkDesModel with source CAPID.
    var srcCapWorkDesModel = getCapWorkDesModel(srcCapId);
    if (srcCapWorkDesModel == null)
    {
        return;
    }
    //2. Copy Detailed Description from source to target.
    var targetCapWorkDesModel = srcCapWorkDesModel.getCapWorkDesModel();
    targetCapWorkDesModel.setCapID(targetCapId);
    aa.cap.createCapWorkDes(targetCapWorkDesModel);
}

function generateReport(itemCap,reportName,module,parameters) {

  //returns the report file which can be attached to an email.
  var user = currentUserID;   // Setting the User Name
  var report = aa.reportManager.getReportInfoModelByName(reportName);
  report = report.getOutput();
  report.setModule(module);
  report.setCapId(itemCap.getCustomID());
  report.setReportParameters(parameters); 

  var permit = aa.reportManager.hasPermission(reportName,user);

  if (permit.getOutput().booleanValue()) {
    var reportResult = aa.reportManager.getReportResult(report);
    if(reportResult.getSuccess()) {
      reportOutput = reportResult.getOutput();
      var reportFile=aa.reportManager.storeReportToDisk(reportOutput);
      reportFile=reportFile.getOutput();
      return reportFile;
    }  else {
      logDebug("System failed get report: " + reportResult.getErrorType() + ":" +reportResult.getErrorMessage());
      return false;
    }
  } else {
    logDebug("You have no permission.");
    return false;
  }
}

function AssignWFByGISLayer(fullName) {

  var reName = /(\w+)\s+(?:(\w(?=\.)|\w+(?:-\w+)?)\s+)?(\w+(?:-\w+)?)/; 
  var matches = fullName.match(reName); 
  var firstName = matches[1]; 
  var middleName = matches[2];  
  var lastName = matches[3]; 
  var nameLen = fullName.split(' ').length;
    
  if(nameLen==3){
  assgnId = aa.person.getUser(firstName,middleName,lastName).getOutput().getUserID(); 
  }

  else {
  assgnId = aa.person.getUser(firstName,"",lastName).getOutput().getUserID(); 
  return assgnId; 
  }
}

function TAPFees() {

  if (AInfo["Type"].equals("Kiosk")) {
    var stdChoice = "LOOKUP:TAPFEES-SINGLETERMKIOSK/SHELTERS";
    }
  if (AInfo["Type"].equals("Bus Shelter")) {
    var stdChoice = "LOOKUP:TAPFEES-SINGLETERMKIOSK/SHELTERS";
    }
  if (AInfo["Type"].equals("Recycling Kiosk")) {
    var stdChoice = "LOOKUP:TAPFEES-SINGLETERMRECYCLING";
    }
    
  var permitTerm = parseInt(AInfo["Permit Term"]);   // takes the ASI field, converts to a number.
  var stdValue = ""; //2011-2012 2012-2013 2013-2014
  var amount = 0;
  var discountPerc = 0.0;
  var fqty = "ttlFeeValue";
  var Type = "";

  vDate = new Date();
  vMonth = vDate.getMonth();
  year = vDate.getFullYear();
  if (vMonth >= 1 && vMonth <= 4)year--;    // decrement the current year by one if it's early in the year

  if (permitTerm > 1) discountPerc = 0.1;  // if permitTerm > 1 year, discount all fees by 10%
  
  logDebug("Discount Percentage: " + discountPerc);
  
  for (var i=1; i <= permitTerm; i++) {  // loop through the # of terms, so this will occur 5 times for 5 years
    stdValue = year + "-" + ++year;

    amount = parseInt(lookup(stdChoice, stdValue));    // increase the year by one for each loop, adding the total to "amount"
    
    discountAmt = amount * discountPerc;
    adjustedAmt = amount-discountAmt;
    
    logDebug("Adjusted amount: " + adjustedAmt);
    
    if (adjustedAmt > 0 && AInfo["Type"].equals("Kiosk")) {
    addFee("ROW_012_002", "ROW_FS_012", "FINAL", adjustedAmt * parseInt(AInfo["Number of Kiosks"]), "Y");
    }
    if (adjustedAmt > 0 && AInfo["Type"].equals("Bus Shelter")) {
      addFee("ROW_012_001", "ROW_FS_012", "FINAL", adjustedAmt * parseInt(AInfo["Number of Shelters"]), "Y");
    }
    if (adjustedAmt > 0 && AInfo["Type"].equals("Recycling Kiosk")) {
      addFee("ROW_012_003", "ROW_FS_012", "FINAL", adjustedAmt * parseInt(AInfo["Number of Recycling Kiosks"]), "Y");
    } 
    
  }
  
}

function trim(str) {
  return str.replace(/^\s+|\s+$/g,"");
}

function editASITableRow(tableCapId, tableName, keyName, keyValue, editName, editValue) {
   var tableArr = loadASITable(tableName, tableCapId);
   var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName,tableCapId,"ADMIN");
   if (tableArr) {
      for (var r in tableArr) {
      var strASITValue = new String(tableArr[r][keyName]);
      var strKeyValue = new String(keyValue);
         if (trim(strASITValue) != trim(strKeyValue)) {
            var rowArr=new Array();
            var tempArr=new Array();
            for (var col in tableArr[r]) {
               var tVal = new asiTableValObj(tableArr[r][col].columnName, tableArr[r][col].fieldValue, tableArr[r][col].readOnly);
               var tVal = tableArr[r][col];
               //bizarre string conversion - just go with it
               var colName = new String(tableArr[r][col].columnName.toString());
               colName=colName.toString();
               tempArr[colName] = tVal;
            }
            rowArr.push(tempArr); 
            //for (var val in rowArr) for (var c in rowArr[val]) aa.print("Value " + c + ": " + rowArr[val][c]);
            addASITable(tableName,rowArr,tableCapId);
         }
         else {
            logDebug(" Editing row " + r);
            var rowArr=new Array();
            var tempArr=new Array();
            for (var col in tableArr[r]) {
               if (tableArr[r][col].columnName.toString() == editName) {
                  var tVal = tableArr[r][col];
                  tVal.fieldValue = editValue;
               }
               else {
                  var tVal = tableArr[r][col];
               }
               //bizarre string conversion - just go with it
               var colName = new String(tableArr[r][col].columnName.toString());
               colName=colName.toString();
               tempArr[colName] = tVal;
            }
            rowArr.push(tempArr); 
            addASITable(tableName,rowArr,tableCapId);
         }
      }
   }//end loop
}

function sendToAccelaPrintingService() {
    //Uses PRINT_UTILITY_MATRIX standard choice to get report names
    var reportName = lookup("PRINT_UTILITY_MATRIX", appTypeString);
    logDebug("Printing Report: " + reportName);
    if (!reportName) {
        logDebug("No Report to Print");
        return null;
    }
    var alternateId = capId.getCustomID();
    var terminalID = PaymentCashierId;
    var paramName = lookup("PRINT_UTILITY_REPORT_PARAMETERS", reportName);
    var paramValue = alternateId;

    var xmlString = "";
    var wsURL = lookup("AccelaPrintingServiceURL", "AccelaPrintingServiceURL");

    logDebug("TerminalID: " + terminalID);

    xmlString += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:acc="http://www.denvergov.org/AccelaPrintingService"><soapenv:Header/><soapenv:Body>';
    xmlString += '<acc:AccelaPrintingRequest>';
    xmlString += '<acc:TerminalId>' + terminalID + '</acc:TerminalId>';
    xmlString += '<acc:ReportName>' + reportName + '</acc:ReportName>';
    xmlString += '<acc:ReportParameters>';
    xmlString += '<acc:Name>' + paramName + '</acc:Name>';
    xmlString += '<acc:Value>' + paramValue + '</acc:Value>'
    xmlString += '</acc:ReportParameters>';
    xmlString += '</acc:AccelaPrintingRequest>';
    xmlString += '</soapenv:Body>';
    xmlString += '</soapenv:Envelope>';

    logDebug("Sending XML: " + xmlString);

    var header = aa.httpClient.initPostParameters();
    header.put("Content-Disposition", "form-data; name='xml'");
    header.put("Content-Type", "text/xml; charset=UTF-8");
    var ws = aa.httpClient.post(wsURL, header, xmlString);
    if (ws.getSuccess()) {
        var returnMsg = ws.getOutput();
        logDebug("Return XML " + returnMsg);
        var sendStatus = aa.util.getValueFromXML("Result", returnMsg);
        logDebug("Send Status: " + sendStatus);
        if (sendStatus.equals("Success")) {
            logDebug("Successfully sent to printer. Record: " + alternateId);
        }
        else {
            logDebug("Printing failed. Record: " + alternateId);
        }
    }
    else {

        logDebug("Problem connecting to the web service. Error: " + ws.getErrorMessage());
    }
}

// Added to support creating of adhoc tasks

function addAdHocTask(adHocProcess, adHocTask, adHocNote)
{
//adHocProcess must be same as one defined in R1SERVER_CONSTANT
//adHocTask must be same as Task Name defined in AdHoc Process
//adHocNote can be variable
//Optional 4 parameters = Assigned to User ID must match an AA user
//Optional 5 parameters = CapID
  var thisCap = capId;
  var thisUser = currentUserID;
  if(arguments.length > 3)
    thisUser = arguments[3]
  if(arguments.length > 4)
    thisCap = arguments[4];
  var userObj = aa.person.getUser(thisUser);
  if (!userObj.getSuccess())
  {
    logDebug("Could not find user to assign to");
    return false;
  }
  var taskObj = aa.workflow.getTasks(thisCap).getOutput()[0].getTaskItem()
  taskObj.setProcessCode(adHocProcess);
  taskObj.setTaskDescription(adHocTask);
  taskObj.setDispositionNote(adHocNote);
  taskObj.setProcessID(0);
  taskObj.setAssignmentDate(aa.util.now());
  taskObj.setDueDate(aa.util.now());
  taskObj.setAssignedUser(userObj.getOutput());
  wf = aa.proxyInvoker.newInstance("com.accela.aa.workflow.workflow.WorkflowBusiness").getOutput();
  wf.createAdHocTaskItem(taskObj);
  return true;
}

function addASIValues(arrayASIFields) {
    
    var total = 0;
    for (x in arrayASIFields) {
        fieldValue = getAppSpecific(arrayASIFields[x]);
        if (fieldValue != null) {
            total += parseFloat(fieldValue);
        }
    }
    return total;
}

function sendNotification(emailFrom,emailTo,emailCC,templateName,params,reportFile)
{
  var itemCap = capId;
  if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args
  var id1 = itemCap.ID1;
  var id2 = itemCap.ID2;
  var id3 = itemCap.ID3;
  var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
  if (!matches(emailTo,null,"",undefined)) {
    var result = null;
    result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
    if(result.getSuccess())
    {
      logDebug("Sent email successfully!");
      return true;
    }
    else
    {
      logDebug("Failed to send mail. - " + result.getErrorType());
      return false;
    }   
  } else {
    logDebug("No email address found for logged in user");
    return false;
  }
}

//Add value to map.
function addParameter(pamaremeters, key, value)
{
  if(key != null)
  {
    if(value == null)
    {
      value = "";
    }
    
    pamaremeters.put(key, value);
  }
}

function elapsed() {
  var thisDate = new Date();
  var thisTime = thisDate.getTime();
  return ((thisTime - startTime) / 1000)
}

function getTaskStatusDate(wfstr, wfstat) // optional process name
  {
  var dateFound = "N";
  var useProcess = false;
  var processName = "";
  if (arguments.length == 3) 
    {
    processName = arguments[2]; // subprocess
    useProcess = true;
    }
        var workflowResult = aa.workflow.getTasks(capId);
  if (workflowResult.getSuccess())
      wfObj = workflowResult.getOutput();
    else
        { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
  
  for (i in wfObj)
    {
      fTask = wfObj[i];
    if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName))){
                     if (fTask.getActiveFlag().equals("Y") && fTask.getDisposition().toUpperCase().equals(wfstat.toUpperCase())  ){
        aDate = new Date(fTask.getStatusDate());
        dateFound = "Y";
               }
                }
  }
    if (dateFound == "Y")
      return aDate;
    else
      return null;
  }

function jsDateToYYYYMMDD(dateValue){
  //Converts Javascript Date to0 pad YYYY/MM/DD
  //
  if (dateValue != null)
  {
  if (Date.prototype.isPrototypeOf(dateValue))
  {
      var M = "" + (dateValue.getMonth()+1); 
      var MM = "0" + M; 
      MM = MM.substring(MM.length-2, MM.length); 
      var D = "" + (dateValue.getDate()); 
      var DD = "0" + D; 
      DD = DD.substring(DD.length-2, DD.length); 
      var YYYY = "" + (dateValue.getFullYear()); 
      return YYYY + MM + DD;
  }
  else
  {
    logDebug("Parameter is not a javascript date");
    return ("INVALID JAVASCRIPT DATE");
  }
  }
  else
  {
  logDebug("Parameter is null");
  return ("NULL PARAMETER VALUE");
  }
}
function closeTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
  {
  var useProcess = false;
  var processName = "";
  if (arguments.length == 5) 
    {
    processName = arguments[4]; // subprocess
    useProcess = true;
    }

  var workflowResult = aa.workflow.getTasks(capId);
  if (workflowResult.getSuccess())
      var wfObj = workflowResult.getOutput();
    else
        { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
  
  if (!wfstat) wfstat = "NA";
  
  for (i in wfObj)
    {
      var fTask = wfObj[i];
    if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
      {
      var dispositionDate = aa.date.getCurrentDate();
      var stepnumber = fTask.getStepNumber();
      var processID = fTask.getProcessID();

      if (useProcess)
        aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
      else
        aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
      
    //  logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat);
      logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat);
      }     
    }
  }



function reviewExists(asitArray, agencyDescription) {

    for (x in asitArray)























































































































































































    {
        if (asitArray[x]["Agency Description"].fieldValue == agencyDescription)
















        {
            return true;
        }










    }
    return false;

}

function reviewExists(taskArray, agencyDescription) {


    for (x in taskArray)
    {
        if (taskArray[x].getTaskDescription().equals(agencyDescription.trim()))
        {
            return true;
        }
    }
    return false;
}

function isDynamicTask(asitTable, taskName) {

    for (y in asitTable)
    {
        if (asitTable[y]["Agency Description"].fieldValue.equals(taskName))
        {
            logDebug("Is Dynamic Task");
            return true;
        }
    }
    return false;
}

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact,conditionOfApproval)
  {
    var addCapCondResult;
    if(arguments.length > 5)
    {
      addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A",conditionOfApproval);
    }
    else 
    {
      addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A");
    }

        if (addCapCondResult.getSuccess())
          {
    logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
    }
  else
    {
    logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
  }

function getAddressInfo(params) {
  // pass in a hashtable and it will add the additional parameters to the table

    var addressLine = "";

  adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");

  if (adResult.getSuccess()) {
    ad = adResult.getOutput().getAddressModel();

    addParameter(params, "$$addressLine$$", ad.getDisplayAddress());
  }
  addParameter(params, "$$Unit#$$", getAppSpecific("Unit Number"));
  addParameter(params, "$$Bld#$$", getAppSpecific("Building Number"));
  addParameter(params, "$$Floor#$$", getAppSpecific("Floor Number"));
  addParameter(params, "$$AddQual$$", getAppSpecific("Address Qualifier"));
  return params;
}

function SendResubmittalNotification() {
// Only call this function from the workflow after event as it uses the wfStaffUserID
// to get the name phone and email of the user updating the workflow task

  var params = aa.util.newHashtable();
  addParameter(params, "$PERMITID$", capId.getCustomID());
  addParameter(params, "$PERMITNAME$", capName);
  addParameter(params, "$$fileDate$$", fileDate);
  addParameter(params, "$$capAlias$$", appTypeArray[2]);
  userObj = aa.person.getUser(wfStaffUserID); 
  if (userObj.getSuccess()) {
    staff = userObj.getOutput();
    staffEmail = staff.getEmail(); 
    staffPhone = staff.getPhoneNumber();
    staffName = staff.getFirstName() + " " + staff.getLastName();
    addParameter(params, "$$email$$", staffEmail);
    addParameter(params, "$$phone$$", staffPhone);
    addParameter(params, "$$staff$$", staffName);   
  }
  conArr = new Array();
  conArr = getContactArray();         
  for (c in conArr) {
    if (conArr[c]["email"] != "" && conArr[c]["email"] != null && conArr[c]["email"] != "undefined") {
      addParameter(params, "$$Applicant$$", conArr[c]["firstName"] + " " + conArr[c]["lastName"]);
      sendNotification("developmentservices@denvergov.org",conArr[c]["email"],"","DS-PROJECT RESUBMITTAL NOTICE",params,null);  
    }
  }
}

function getDateString(date) {

    if (date) {
        dateArray = new Array();
        dateArray = date.split("/");

        var monthNames = new Array("January", "February", "March",  "April", "May", "June", "July", "August", "September",  "October", "November", "December");

        return monthNames[dateArray[0] - 1] + " " + dateArray[1] + ", " + dateArray[2];
    }
    return "";

}



function getTaskSpecific(wfName,itemName) {  // optional: itemCap
  var i=0;
  itemCap = capId;
  if (arguments.length == 4) 
    itemCap = arguments[3]; // use cap ID specified in args
  var workflowResult = aa.workflow.getTasks(itemCap);
  if (workflowResult.getSuccess())
    var wfObj = workflowResult.getOutput();
  else {
    logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); 
    return false; 
  }
  for (i in wfObj) {
    fTask = wfObj[i];
    stepnumber = fTask.getStepNumber();
    processID = fTask.getProcessID();
    if (wfName.equals(fTask.getTaskDescription())) { // Found the right Workflow Task
      TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap,processID,stepnumber,itemName);
      if (TSIResult.getSuccess()) {
        var TSI = TSIResult.getOutput();
        if (TSI != null) {
          var TSIArray = new Array();
          TSInfoModel = TSI.getTaskSpecificInfoModel();
          var itemValue = TSInfoModel.getChecklistComment();
          return itemValue;
        }
        else {
          logDebug("No task specific info field called "+itemName+" found for task "+wfName);
          return false;
        }
      }
      else {
        logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIResult.getErrorMessage());
        return false;
      }
    }  // found workflow task
  } // each task
  return false;
}

function createPendingInspection(iGroup,iType) // optional parameters Required Inspection("Y") and Cap ID
  {
  var iReq = null;
  var itemCap = capId;
  if (arguments.length == 3) iReq = arguments[2]; // use value specified in args
  if (arguments.length == 4) {
    iReq = arguments[2]; // use value specified in args
    itemCap = arguments[3]; // use cap ID specified in args
  }
  var itmResult = aa.inspection.getInspectionType(iGroup,iType)
  
  if (!itmResult.getSuccess())
    {
    logDebug("**WARNING error retrieving inspection types: " + itmResult.getErrorMessage());
    return false;
    }

  var itmArray = itmResult.getOutput();
  
  if (!itmArray)
    {
    logDebug("**WARNING could not find any matches for inspection group " + iGroup + " and type " + iType);
    return false;
    }

  var itmSeq = null;
  
  for (thisItm in itmArray)
    {
    var it = itmArray[thisItm];
    if (it.getGroupCode().toUpperCase().equals(iGroup.toUpperCase()) && it.getType().toUpperCase().equals(iType.toUpperCase()))
      itmSeq = it.getSequenceNumber();
    }

  if (!itmSeq)
    {
    logDebug("**WARNING could not find an exact match for inspection group " + iGroup + " and type " + iType);
    return false;
    }
    
  var inspModel = aa.inspection.getInspectionScriptModel().getOutput().getInspection();
  
  var activityModel = inspModel.getActivity();
  activityModel.setInspSequenceNumber(itmSeq);
  if(iReq == "Y")
    activityModel.setRequiredInspection(iReq);
  activityModel.setCapIDModel(itemCap);

  pendingResult = aa.inspection.pendingInspection(inspModel)

  if (pendingResult.getSuccess())
    {
    logDebug("Successfully created pending inspection group " + iGroup + " and type " + iType);
    return true;
    }
  else
    {
    logDebug("**WARNING could not create pending inspection group " + iGroup + " and type " + iType + " Message: " + pendingResult.getErrorMessage());
    return false;
    }
  
}

function getUserID(fullName) {
    if (!fullName) {
        return null;
    }
    firstLast = fullName.split(" ")
    userObj = aa.person.getUser(firstLast[0], " ", firstLast[1]); 
    if (userObj.getSuccess()) {
        staff = userObj.getOutput();
        staffId = staff.getGaUserID(); 
        return staffId;
    }
    else {
        return null;
    }
}

function allInspectionsApproved() {
  var approved = true;
  var inspResultObj = aa.inspection.getInspections(capId);
  if (inspResultObj.getSuccess()) {
    var inspList = inspResultObj.getOutput();
    for (xx in inspList) { 
      var iType = inspList[xx].getInspectionType();
      a = isApproved(iType)
      if(a == false)
        approved = false;
    }
  }
  return approved;
}

function isApproved(inspType) {
  var found = false;
  var inspResultObj = aa.inspection.getInspections(capId);
  if (inspResultObj.getSuccess())
    {
    var inspList = inspResultObj.getOutput();
    for (xx in inspList)
      if (String(inspType).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().equals("Approved"))
        found = true;
    }
  return found;
}

function editTaskHoursSpent(wfstr, hoursSpent) // optional process name.  if wfstr == "*", set for all tasks
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 3) 
    {
        processName = arguments[2]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
  
    for (i in wfObj)
    {
        var fTask = wfObj[i];
        if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")  && (!useProcess || fTask.getProcessCode().equals(processName)))
        {
            wfObj[i].setHoursSpent(hoursSpent);
            var fTaskModel = wfObj[i].getTaskItem();
            fTaskModel.setHoursSpent(hoursSpent);
            //var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
            var tResult = aa.workflow.adjustTask(fTaskModel);
            if (tResult.getSuccess())
                logDebug("Set Workflow Task: " + fTask.getTaskDescription() + " hours spent " + hoursSpent);
            else
            { logMessage("**ERROR: Failed to update hours spent on workflow: " + tResult.getErrorMessage()); return false; }
        }     
    }
}
function setIVR(){
  var datesNoMatch = true;
  incrNbr = 1;
  while (datesNoMatch){
    ivrnum = (parseInt(lookup("IVR:DenverIVRLookupNmbr","IVRNewNmbr")) + 1); 
    editLookup("IVR:DenverIVRLookupNmbr","IVRNewNmbr",ivrnum);
    // new a CapScriptModel
    logDebug("ivrnum: " + ivrnum);
    logDebug("curr ivr nbr: " +capId.getTrackingID());
    var scriptModel = aa.cap.newCapScriptModel().getOutput();
    // get a new CapModel
    var capModel = scriptModel.getCapModel();
    var capIDModel = capModel.getCapID();
    capIDModel.setServiceProviderCode(scriptModel.getServiceProviderCode());
    capIDModel.setID1(aa.env.getValue("PermitId1"));
    capIDModel.setID2(aa.env.getValue("PermitId2"));
    capIDModel.setID3(aa.env.getValue("PermitId3"));
    capModel.setTrackingNbr(ivrnum);
    capModel.setCapID(capIDModel);
    // update tracking number
    aa.cap.editCapByPK(capModel);

    //capId.setTrackingID(ivrnum);
    //see if ivr nbr was really updated
    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");
    var capResult = aa.cap.getCapID(s_id1, s_id2, s_id3).getOutput();
    //var capResult = aa.cap.getCapDetail(capId).getOutput();
    //var capResult = aa.cap.getCap(capId);
    //capModel = capResult.getOutput().getCapModel();
    //var cap = aa.cap.getCap(capId).getOutput().getCapModel();
    //updatedIVRNbr = cap.getTrackingNbr();  // always returns zero
    //updatedIVRNbr = capModel.getTrackingNbr(); //always returns var ivrnum
    getCapId();
    updatedIVRNbr = capResult.getTrackingID();
    logDebug("updatedIVRNbr: " + updatedIVRNbr);
    if(updatedIVRNbr == ivrnum) {
      datesNoMatch = false;
      logDebug("IVR Tracking Number updated to " + ivrnum);
    } else{
      incrNbr ++;
      logDebug("incrNbr: " + incrNbr);
      if (incrNbr >50) datesNoMatch=false;
    }
  }
}

function proximityGIS(svc,layer,numDistance, attribute)  // optional: distanceType
{
    // returns true if the app has a gis object in proximity
    // use with all events except ApplicationSubmitBefore
    // 6/20/07 JHS - Changed errors to Warnings in case GIS server unavailable.

    var distanceType = "feet"
    if (arguments.length == 5) distanceType = arguments[4]; // use distance type in arg list

    var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
    if (bufferTargetResult.getSuccess())
    {
        var buf = bufferTargetResult.getOutput();
        //buf.addAttributeName(layer + "_ID");
        buf.addAttributeName(attribute);
    }
    else
    { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }
    logDebug("Going through GIS objects");
    for (a1 in fGisObj) // for each GIS object on the Cap
    {
        var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

        if (bufchk.getSuccess())
            var proxArr = bufchk.getOutput();
        else
        { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }
        logDebug("Got buffer");
        for (a2 in proxArr)
        {
            var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
            logDebug("Proximity object: " + proxObj.length);
            if (proxObj.length)
            {
                return true;
            }
        }
    }
    return false;
}

function processAdminModReviewTasks(areParallelTasksBeingActivated) {

    tsiArray = new Array();
    useTaskSpecificGroupName = true;
    loadTaskSpecific(tsiArray);
    var typeOfBidLog = getAppSpecific("Type of BID Log");

    for (x in tsiArray) {

        var taskSpecific = x.split(".");

        if (taskSpecific[1] != "Application Intake") {
            continue;
        }
        if (taskSpecific[2] == "Initial Review Due Date") {
            continue;
        }

        var taskName = taskSpecific[2];
        var currentTaskStatus = taskStatus(taskName);

        if (tsiArray[x] != "CHECKED") {
            logDebug("Current Task Status of " + taskName + " is " + taskStatus(taskName));
            
            if (currentTaskStatus == "NA" || currentTaskStatus == null || currentTaskStatus == "null") {
                closeTask(taskName, "NA", "Updated via script", "Updated via script");
            }
            else if (currentTaskStatus == "Approved" || currentTaskStatus == "Not Approved" || currentTaskStatus == "Review Not Required") {
                closeTask(taskName, currentTaskStatus, "Updated via script", "Updated via script");
            }
            continue;
        }

        logDebug("Is Checked? " + taskName + ": " + tsiArray[x]);

        editTaskSpecific("Application Intake", taskName, null);

        var initialDueDateArray = tsiArray["DS_WF_001.Application Intake.Initial Review Due Date"].split("/");
        var initialDueDate = new Date(initialDueDateArray[2], initialDueDateArray[0] - 1, initialDueDateArray[1]);

        if (isTaskActive(taskName) && !areParallelTasksBeingActivated) {
            logDebug("Task is active");
            if (isTaskStatus(taskName, "Resubmittal Review")) {

                //updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");

                if (typeOfBidLog == "Intermediate Commercial") {

                    editTaskDueDate(taskName, dateAdd(null, 10, "Y"));

                }

            }
            else {

                if (isTaskStatus(taskName, "Initial Review")) {

                    editTaskDueDate(taskName, dateAdd(initialDueDate, 0, "Y"));
                }
            }

        }
        else {

            activateTask(taskName, "Updated via script", "Updated via script");   

            if (currentTaskStatus == "null" || currentTaskStatus == null) {
                updateTask(taskName, "Initial Review", "Updated via script", "Updated via script");
            }
            else if (currentTaskStatus == "Resubmittal Review") {
                continue;
            }
            else if (currentTaskStatus != "Initial Review") {
                updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");
                
                if (typeOfBidLog == "Intermediate Commercial") {

                    editTaskDueDate(taskName, dateAdd(null, 10, "Y")); 

                }
                continue;
            }
            
            var today = new Date();
            //logDebug(initialDueDate.toString() + " today " + today.toString());
            if (initialDueDate < today) {

                if (typeOfBidLog == "Intermediate Commercial") {

                    editTaskDueDate(taskName, dateAdd(null, 10, "Y"));

                }

            }
            else {

                editTaskDueDate(taskName, dateAdd(initialDueDate, 0, "Y"));

            }
        }
    }
}

function processFireReviewTasks(areParallelTasksBeingActivated) {
    tsiArray = new Array();
    useTaskSpecificGroupName = true;
    loadTaskSpecific(tsiArray);
    for (x in tsiArray) {
        logDebug("-----------------------------------------------------------------------");
        var taskSpecific = x.split(".");
        if (taskSpecific[1] != "Application Intake") {
            continue;
        }
        var taskName = taskSpecific[2];
        var currentTaskStatus = taskStatus(taskName);
        //logDebug("taskName: " + taskName)
        //logDebug("currentTaskStatus: " + currentTaskStatus)
        logDebug("tsiArray[x]: " + tsiArray[x])
        if (tsiArray[x] != "CHECKED") {
            if (currentTaskStatus == "NA" || currentTaskStatus == null || currentTaskStatus == "null") {
                closeTask(taskName, "NA", "Updated via script", "Updated via script");
            }
            else if (currentTaskStatus == "Approved" || currentTaskStatus == "Withdrawn" || currentTaskStatus == "Review Not Required") {
                closeTask(taskName, currentTaskStatus, "Updated via script", "Updated via script");
            }
            continue;
        }      
        //logDebug("Processing task: " + taskName);
        if (!matches(taskName, "Architectural Review", "Electrical Review", "Plumbing Review", "Mechanical Review", "Structural Review", "Fire Review", "Landmark Review", "Zoning Review", "Floodplain Review")) {
            //logDebug("Not finding pertinent task: " + taskName);
            continue;
        }
        //logDebug("Is Checked? " + taskName + ": " + tsiArray[x]);
        editTaskSpecific("Application Intake", taskName, null);
        var tasks = aa.workflow.getTasks(capId).getOutput();
        var initialDueDateArray = tsiArray[tasks[0].getProcessCode() + ".Application Intake.Initial Review Due Date"].split("/");
        var initialDueDate = new Date(initialDueDateArray[2], initialDueDateArray[0] - 1, initialDueDateArray[1]);
        //logDebug("initialDueDate: " + initialDueDate);
        if (isTaskActive(taskName) && !areParallelTasksBeingActivated) {
            //logDebug("Task is active");
            if (currentTaskStatus != "null" && currentTaskStatus != null && currentTaskStatus != "NA" && currentTaskStatus != "Initial Review" && currentTaskStatus != "Resubmittal Review") {
                updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");
                editTaskDueDate(taskName, dateAdd(null, 7, "Y"));
                continue
            }
        }
        else {
            activateTask(taskName, "Updated via script", "Updated via script");
            if (currentTaskStatus == "null" || currentTaskStatus == null || currentTaskStatus == "NA") {
                updateTask(taskName, "Initial Review", "Updated via script", "Updated via script");
            }
            else if (currentTaskStatus == "Resubmittal Review") {
                editTaskDueDate(taskName, dateAdd(null, 7, "Y"));
                //logDebug("3: Vote for Pedro");
        
            }
            else if (currentTaskStatus != "null" && currentTaskStatus != null && currentTaskStatus != "NA" && currentTaskStatus != "Initial Review" && currentTaskStatus != "Resubmittal Review") {
                updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");
                editTaskDueDate(taskName, dateAdd(null, 7, "Y"));
                continue
            }
            var today = new Date();
            //logDebug(initialDueDate.toString() + " today " + today.toString());
            if (initialDueDate < today) {
                editTaskDueDate(taskName, dateAdd(null, 7, "Y"));
                continue
            }
            else {
                if(taskName=="Fire Review") { 
                    editTaskDueDate(taskName, dateAdd(null, 15, "Y"));
                    continue
                }else{
                    editTaskDueDate(taskName, dateAdd(initialDueDate, 15, "Y"));
                }
            }
        }
    }
}

/***********************************************************
Custom Function: getTaskUpdatedByUserID
Parameters:
1)vTaskName = the workflow task name
2)vCapId = cap ID object

Example Usage:

wfTaskUpdatedBy = getTaskUpdatedByUserID("Inspection",capId);
logDebug("wfTaskUpdatedBy: " + wfTaskUpdatedBy);

*************************************************************/

function getTaskUpdatedByUserID(vTaskName, vCapId)
{
  ltCapId = vCapId;

  var workflowResult = aa.workflow.getTasks(ltCapId);
  if (workflowResult.getSuccess())
    wfObj = workflowResult.getOutput();
  else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

  for (i in wfObj)
  {
    fTask = wfObj[i];
    
    if (fTask.getTaskDescription()==vTaskName)
    {
      
      fTaskModel = fTask.getTaskItem();
      wfUpdatedBy = fTaskModel.getAuditID();
      for(xx in fTaskModel) logDebug(xx + ": " + fTaskModel[xx]);
      
      logDebug("vTaskName=" + vTaskName);
      return wfUpdatedBy;
    
    }
  }
  logDebug("WF Task " + vTaskName + " does not exist or has not been completed");
  return false;
}

function getCapsByAddressBefore(appType) { //optional statuses to check
  var retArr = new Array();
  var statusArray = new Array();
  if (arguments.length > 0) {
    for (var i=0; i<arguments.length;i++) 
      statusArray.push(arguments[i]);
  }
  if (AddressValidatedNumber > 0) // get the address info from lookup table
    {
    addObj = aa.address.getRefAddressByPK(parseInt(AddressValidatedNumber)).getOutput();
    AddressStreetName = addObj.getStreetName();
    AddressHouseNumber = addObj.getHouseNumberStart();
    AddressStreetSuffix = addObj.getStreetSuffix();
    AddressZip = addObj.getZip();
    AddressStreetDirection = addObj.getStreetDirection();
    }

   if (AddressStreetDirection == "") AddressStreetDirection = null;
   if (AddressHouseNumber == "") AddressHouseNumber = 0;
   if (AddressStreetSuffix == "") AddressStreetSuffix = null;
   if (AddressZip == "") AddressZip = null;
 
  // get caps with same address
  capAddResult = aa.cap.getCapListByDetailAddress(AddressStreetName,parseInt(AddressHouseNumber),AddressStreetSuffix,AddressZip,AddressStreetDirection,null);
  if (capAddResult.getSuccess())
    { var capIdArray=capAddResult.getOutput(); }
  else
    { logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


  for (cappy in capIdArray)
    {
    relcap = aa.cap.getCap(capIdArray[cappy].getCapID());
    if(relcap.getSuccess()){
      relcap = relcap.getOutput();
        //logDebug(relcap.getCapType());
        if(statusArray.length>0){
          if( exists(relcap.getCapStatus(), statusArray) && relcap.getCapType().toString()==appType)
            retArr.push(capIdArray[cappy]);
        }
      }
    }
  if (retArr.length > 0){
    return retArr;
  }else{
    return false;
  }
}

function getRecordParams4Notification(params) {
  // pass in a hashtable and it will add the additional parameters to the table
  addParameter(params, "$$altID$$", capIDString);
  addParameter(params, "$$capName$$", capName);
  addParameter(params, "$$capStatus$$", capStatus);
  addParameter(params, "$$fileDate$$", fileDate);
  addParameter(params, "$$shortNotes$$", getShortNotes(capId));
  addParameter(params, "$$balanceDue$$", "$" + parseFloat(balanceDue).toFixed(2));
  userObj = aa.person.getUser(wfStaffUserID); 
  if (userObj.getSuccess()) {
    staff = userObj.getOutput();
    staffEmail = staff.getEmail(); 
    staffPhone = staff.getPhoneNumber();
    staffName = staff.getFirstName() + " " + staff.getLastName();
    addParameter(params, "$$email$$", staffEmail);
    addParameter(params, "$$phone$$", staffPhone);
    addParameter(params, "$$staff$$", staffName);   
  }
  return params;
}

function getContactObj(itemCap, typeToLoad) {
  // returning the first match on contact type
  var capContactArray = null;
  var cArray = new Array();
  if (itemCap.getClass() == "com.accela.aa.aamain.cap.CapModel") { // page flow script
    var capContactArray = cap.getContactsGroup().toArray();
  } else {
    var capContactResult = aa.people.getCapContactByCapID(itemCap);
    if (capContactResult.getSuccess()) {
      var capContactArray = capContactResult.getOutput();
    }
  }
  if (capContactArray) {
    for (var yy in capContactArray) {
      if (capContactArray[yy].getPeople().contactType.toUpperCase().equals(typeToLoad.toUpperCase())) {
        logDebug("getContactObj returned the first contact of type " + typeToLoad + " on record " + itemCap.getCustomID());
        return new contactObj(capContactArray[yy]);
      }
    }
  }
  logDebug("getContactObj could not find a contact of type " + typeToLoad + " on record " + itemCap.getCustomID());
  return false;
}

function contactObj (ccsm)  {

    this.people = null;         // for access to the underlying data
    this.capContact = null;     // for access to the underlying data
    this.capContactScript = null;   // for access to the underlying data
    this.capId = null;
    this.type = null;
    this.seqNumber = null;
    this.refSeqNumber = null;
    this.asiObj = null;
    this.asi = new Array();    // associative array of attributes
    this.primary = null;
    this.relation = null;
    this.addresses = null;  // array of addresses
    this.validAttrs = false;
        
    this.capContactScript = ccsm;
    if (ccsm)  {
        if (ccsm.getCapContactModel == undefined) {  // page flow
            this.people = this.capContactScript.getPeople();
            this.refSeqNumber = this.capContactScript.getRefContactNumber();
            }
        else {
            this.capContact = ccsm.getCapContactModel();
            this.people = this.capContact.getPeople();
            this.refSeqNumber = this.capContact.getRefContactNumber();
            if (this.people.getAttributes() != null) {
                this.asiObj = this.people.getAttributes().toArray();
                if (this.asiObj != null) {
                    for (var xx1 in this.asiObj) {
            this.asi[this.asiObj[xx1].attributeName] = this.asiObj[xx1];
            logDebug(this.asi[this.asiObj[xx1].attributeName]);
            this.validAttrs = true; 
            logDebug("This record has valid attributes");
          }
                }   
            }
        }  
        //this.primary = this.capContact.getPrimaryFlag().equals("Y");
        this.relation = this.people.relation;
        this.seqNumber = this.people.contactSeqNumber;
        this.type = this.people.getContactType();
        this.capId = this.capContactScript.getCapID();
        var contactAddressrs = aa.address.getContactAddressListByCapContact(this.capContact);
        if (contactAddressrs.getSuccess()) {
            this.addresses = contactAddressrs.getOutput();
            var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
            this.people.setContactAddressList(contactAddressModelArr);
            }
        else {
            pmcal = this.people.getContactAddressList();
            if (pmcal) {
                this.addresses = pmcal.toArray();
            }
        }
    }
  this.toString = function() { return this.capId + " : " + this.type + " " + this.people.getLastName() + "," + this.people.getFirstName() + " (id:" + this.seqNumber + "/" + this.refSeqNumber + ") #ofAddr=" + this.addresses.length + " primary=" + this.primary;  }
  
  this.getEmailTemplateParams = function (params) {
    addParameter(params, "$$LastName$$", this.people.getLastName());
    addParameter(params, "$$FirstName$$", this.people.getFirstName());
    addParameter(params, "$$MiddleName$$", this.people.getMiddleName());
    addParameter(params, "$$BusinesName$$", this.people.getBusinessName());
    addParameter(params, "$$ContactSeqNumber$$", this.seqNumber);
    addParameter(params, "$$ContactType$$", this.type);
    addParameter(params, "$$Relation$$", this.relation);
    addParameter(params, "$$Phone1$$", this.people.getPhone1());
    addParameter(params, "$$Phone2$$", this.people.getPhone2());
    addParameter(params, "$$Email$$", this.people.getEmail());
    addParameter(params, "$$AddressLine1$$", this.people.getCompactAddress().getAddressLine1());
    addParameter(params, "$$AddressLine2$$", this.people.getCompactAddress().getAddressLine2());
    addParameter(params, "$$City$$", this.people.getCompactAddress().getCity());
    addParameter(params, "$$State$$", this.people.getCompactAddress().getState());
    addParameter(params, "$$Zip$$", this.people.getCompactAddress().getZip());
    addParameter(params, "$$Fax$$", this.people.getFax());
    addParameter(params, "$$Country$$", this.people.getCompactAddress().getCountry());
    addParameter(params, "$$FullName$$", this.people.getFullName());
    return params;
  }
}

function assessPublicWorksROWFees(){
// THIS FUNCTION IS BEING REPLACED BY assessROWPublicWorksPermitFees AS OF 10-12-2015
  var ttlFee = 0;
  for (x in ROWCONSTRUCTIONTABLE) {
    var ttlFee = 0;
    //logDebug(ROWCONSTRUCTIONTABLE[x]["Construction Item"]);
    switch (ROWCONSTRUCTIONTABLE[x]["Construction Item"].toString()) {
    case "Curb and Gutter":   
      addFee("ROW_20_001","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Curb Cut/Driveway":
      addFee("ROW_20_016","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Handicap Ramp":
      addFee("ROW_20_016","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Sidewalk":
      if(parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"])<=5){
        ttlFee = parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]);
      }else{
        ttlFee = (parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]) * parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"]))/5;
      }
      addFee("ROW_20_001","ROW_FS_020","FINAL", ttlFee,"Y");
      break;
    case "Combination Curb/Gutter/Sidewalk":
      ttlFee = parseFloat(ROWCONSTRUCTIONTABLE[x]["Fee Calculation"]);
      addFee("ROW_20_019","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Asphalt Patch":
      ttlFee = parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]);
      addFee("ROW_20_017","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Asphalt Pave":
      if(parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"])<=12){
        ttlFee =  parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]);
      }else{
        ttlFee =  (parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]) * parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"]))/12;
      }
      addFee("ROW_20_017","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Concrete Paving":
      if(parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"])<=12){
        ttlFee = parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]);
      }else{
        ttlFee = (parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]) * parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"]))/12;
      }
      addFee("ROW_20_018","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Sidewalk Drain Chase":
      addFee("ROW_20_015","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Tree Grates":
      addFee("ROW_20_015","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Bus Pad Street":
      addFee("ROW_20_024","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Bus Pad Behind Curb":
      addFee("ROW_20_024","ROW_FS_020","FINAL",1,"Y");
      break;
    case "Non-Standard Inspection":
      addFee("ROW_FS_025","ROW_FS_020","FINAL",1,"Y");
      break;
    }
  }
  var ttlInsp = 0;
  for (y in SEWER) {
    ttlInsp+=parseInt(SEWER[y]["Number of Inspections"]);
  }
  if(ttlInsp>0) updateFee("ROW_20_004","ROW_FS_020","FINAL", ttlInsp, "Y");
  if (AInfo["ROW Street Cut Permit Fee Total"]>0) updateFee("ROW_20_003","ROW_FS_020","FINAL", AInfo["ROW Street Cut Permit Fee Total"],"Y");
  if(AInfo["ROW Street Occupancy Permit Fee Total"]>0) addFee("ROW_20_002","ROW_FS_020","FINAL", AInfo["ROW Street Occupancy Permit Fee Total"],"Y");
  //if(grandTtlFee<50 && rowExists) addFee("ROW_20_002","ROW_FS_020","FINAL", 50 -grandTtlFee ,"Y");
  if(AInfo["Street Occupancy Permit"]=="CHECKED") updateFee("ROW_20_025","ROW_FS_020" ,"FINAL",1,"Y")

}

function assessROWPublicWorksPermitFees(){
  var ttlFee = 0;
  for (x in ROWCONSTRUCTIONTABLE) {
    var ttlFee = 0;

    rLen = parseFloat(ROWCONSTRUCTIONTABLE[x]["Length/Lineal Feet"]);
    rWid = parseFloat(ROWCONSTRUCTIONTABLE[x]["Width"]);
    rEach = parseFloat(ROWCONSTRUCTIONTABLE[x]["Each"]);    
    ttlFee = parseFloat(ROWCONSTRUCTIONTABLE[x]["Fee Calculation"]);
    
    //logDebug(ROWCONSTRUCTIONTABLE[x]["Construction Item"]);
    switch (ROWCONSTRUCTIONTABLE[x]["Construction Item"].toString()) {
    
    case "Curb and Gutter":
      addFee("ROW_20_001","ROW_FS_020","FINAL",rLen,"Y");
      break;
    case "Curb Cut/Driveway":
      addFee("ROW_20_016","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Handicap Ramp":
      addFee("ROW_20_016","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Sidewalk":
      if(rWid.value<=5){
        ttlFee = rLen;
      }else{
        ttlFee = (rLen * rWid)/5;
      }
      addFee("ROW_20_001","ROW_FS_020","FINAL", ttlFee,"Y");
      break;
    case "Combination Curb/Gutter/Sidewalk":
      addFee("ROW_20_019","ROW_FS_020","FINAL",rLen,"Y");
      break;
    case "Asphalt Patch":
      addFee("ROW_20_017","ROW_FS_020","FINAL",rLen,"Y");
      break;
    case "Asphalt Pave":
      if(rWid.value<=12){
        ttlFee =  rLen;
      }else{
        ttlFee =  (rLen * rWid)/12;
      }
      addFee("ROW_20_017","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Concrete Paving":
      if(rWid.value<=12){
        ttlFee = rLen;
      }else{
        ttlFee = (rLen * rWid)/12;
      }
      addFee("ROW_20_018","ROW_FS_020","FINAL",ttlFee,"Y");
      break;
    case "Sidewalk Drain Chase":
      addFee("ROW_20_015","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Tree Grates":
      addFee("ROW_20_015","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Bus Pad Street":
      addFee("ROW_20_024","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Bus Pad Behind Curb":
      addFee("ROW_20_024","ROW_FS_020","FINAL",rEach,"Y");
      break;
    case "Non-Standard Inspection":
      addFee("ROW_FS_025","ROW_FS_020","FINAL",rEach,"Y");
      break;
    }
  }
  var ttlInsp = 0;
  for (y in SEWER) {
    ttlInsp+=parseInt(SEWER[y]["Number of Inspections"]);
  }
  if(ttlInsp>0) updateFee("ROW_20_004","ROW_FS_020","FINAL", ttlInsp, "Y");
  if (AInfo["ROW Street Cut Permit Fee Total"]>0) updateFee("ROW_20_003","ROW_FS_020","FINAL", AInfo["ROW Street Cut Permit Fee Total"],"Y");
  if(AInfo["ROW Street Occupancy Permit Fee Total"]>0) addFee("ROW_20_002","ROW_FS_020","FINAL", AInfo["ROW Street Occupancy Permit Fee Total"],"Y");
  //if(grandTtlFee<50 && rowExists) addFee("ROW_20_002","ROW_FS_020","FINAL", 50 -grandTtlFee ,"Y");
  if(AInfo["Street Occupancy Permit"]=="CHECKED") updateFee("ROW_20_025","ROW_FS_020" ,"FINAL",1,"Y")

}

function updateTask(wfstr,wfstat,wfcomment,wfnote) // optional process name, cap id
  {
  var useProcess = false;
  var processName = "";
  if (arguments.length > 4) 
    {
    if (arguments[4] != "")
      {
      processName = arguments[4]; // subprocess
      useProcess = true;
      }
    }
  var itemCap = capId;
  if (arguments.length == 6) itemCap = arguments[5]; // use cap ID specified in args
 
  var workflowResult = aa.workflow.getTaskItems(itemCap,wfstr,processName,null,null,null);
  if (workflowResult.getSuccess())
    var wfObj = workflowResult.getOutput();
  else
  { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
            
  if (!wfstat) wfstat = "NA";
            
  for (i in wfObj)
    {
    var fTask = wfObj[i];
    if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
      {
      var dispositionDate = aa.date.getCurrentDate();
      var stepnumber = fTask.getStepNumber();
      var processID = fTask.getProcessID();
      if (useProcess)
        aa.workflow.handleDisposition(itemCap,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj,"U");
      else
        aa.workflow.handleDisposition(itemCap,stepnumber,wfstat,dispositionDate,wfnote,wfcomment,systemUserObj,"U");
      //logMessage("Updating Workflow Task " + wfstr + " with status " + wfstat);
      logDebug("Updating Workflow Task " + wfstr + " with status " + wfstat);
      }                                   
    }
  }
  
  function getOFCARD() {

  var schedNum = getGISInfo("AccelaAutomation", "Parcels", "SCHEDNUM");
        
  var url = lookup("OFCARDWEBSERVICEURL", "OFCARDWEBSERVICEURL");
  var parms = "where=SCHEDNUM+%3D+%27" + schedNum + "%27"
     + "&geometryType=esriGeometryEnvelope"
     + "&spatialRel=esriSpatialRelIntersects"
     + "&outFields=OFCARD"
     + "&returnGeometry=false"
     + "&returnIdsOnly=false"
     + "&returnCountOnly=false"
     + "&returnZ=false"
     + "&returnM=false"
     + "&returnDistinctValues=false"
     + "&f=pjson";

  var rootNode = aa.util.httpPost(url, parms).getOutput();

  var obj = JSON.parse(rootNode);
        
        if (obj.features == "") {
           logDebug("OFCARD web service did not return a value.");
     return "1";
        }
        else {
           logDebug("OFCARD is " + obj.features[0].attributes.OFCARD);

     return obj.features[0].attributes.OFCARD
        }
}

function setPendingInspectionDates() {

    var inspectionModelList = aa.inspection.getInspections(capId).getOutput();

    for (x in inspectionModelList) {
        
        if (inspectionModelList[x].getInspectionStatus() == "Pending") {
            inspectionModelList[x].setInspectionStatusDate(aa.date.getCurrentDate());
            inspectionModelList[x].setScheduledDate(aa.date.getCurrentDate());
            aa.inspection.editInspection(inspectionModelList[x])
            logDebug("Setting dates on inspectionID " + inspectionModelList[x].getIdNumber())
        }
    }

}

function getTransactionalLicProfLicType() {

    var capContResult = aa.licenseScript.getLicenseProf(capId);
    if (capContResult.getSuccess())
    { 
        conArr = capContResult.getOutput(); 
    }
    else
    {
        aa.print("**WARNING: getting cap licensed professional: " + capContResult.getErrorMessage());
        return null;
    }

    if (!conArr) {
        aa.print("**WARNING: No licensed professional available");
        return null;
    }

    if (!conArr.length) {
        aa.print("**WARNING: No licensed professional available");
        return null;
    }
    for (yy in conArr) {
        if (conArr[yy].getLicenseNbr().substring(0, 3) == "LIC") {
            return conArr[yy].getLicenseType();
        }
    }
    
}
function capIdsGetByAddrStatus(ats,chkStatus) {
    var capIdArray = new Array();
    capIdArray = capIdsGetByAddr(capId);
    
    var retArr = new Array();
    for (cappy in capIdArray){
       
        relcap = aa.cap.getCap(capIdArray[cappy]).getOutput();
        // get cap type
        reltype = relcap.getCapType().toString();
        reltypeArray = reltype.split("/")
        var isMatch = true;
        var ata = ats.split("/");
        if (ata.length != 4) {
            logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
        }
        else {
            for (xx in ata) {
                if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*")){
                    isMatch = false;
                }
            }
            
            if (isMatch && relcap.getCapStatus() == chkStatus)  {
                retArr.push(capIdArray[cappy]);
            }
        }
    } // loop through related caps
    if (retArr.length > 0){
        return retArr;
    }
    else {
        return false;
    }
}
function isTransactionalLicProfLicType(licProfType) {

    var capContResult = aa.licenseScript.getLicenseProf(capId);
    if (capContResult.getSuccess())
    { 
        conArr = capContResult.getOutput(); 
    }
    else
    {
        aa.print("**WARNING: getting cap contact: " + capContResult.getErrorMessage());
        return false;
    }

    if (!conArr) {
        aa.print("**WARNING: No contact available");
        return false;
    }

    if (!conArr.length) {
        aa.print("**WARNING: No contact available");
        return false;
    }
    if (conArr[0].getLicenseType().toUpperCase() == licProfType.toUpperCase()) {
        return true;
    } 
    else {
        return false;
    }
}

function runPrintUtilityAsync() {
    
    var scriptName = "PRINTUTILITYSENDASYNC";
  var envParameters = aa.util.newHashMap();
  
  envParameters.put("CapID",capId);
  envParameters.put("CustomCapId",capId.getCustomID());
  envParameters.put("ReportUser",currentUserID);
  envParameters.put("ServProvCode",servProvCode);
  envParameters.put("AppTypeString", appTypeString);
  envParameters.put("PaymentCashierId", PaymentCashierId);
  
  var result = aa.runAsyncScript(scriptName, envParameters);
  
}

function rowConstrFees(){
  var grdTtlFee = 0;
  var tblConstr = new Array();
  tblConstr=ROWCONSTRUCTIONTABLE;
  for(var rowIndex=0; rowIndex<ROWCONSTRUCTIONTABLE.length; rowIndex++){
    var ttlFee=0;
    var rConstr=ROWCONSTRUCTIONTABLE[rowIndex]["Construction Item"];
    rWid=ROWCONSTRUCTIONTABLE[rowIndex]["Width"];
    rLen=ROWCONSTRUCTIONTABLE[rowIndex]["Length/Lineal Feet"];
    tblConstr[rowIndex]["Construction Item"]=rConstr.toString();
    tblConstr[rowIndex]["Width"]=rWid.toString();
    tblConstr[rowIndex]["Length/Lineal Feet"]=rLen.toString();
    switch (""+rConstr) {
    case "Curb and Gutter":
      ttlFee = rLen;
      addFee("ROW_20_001","ROW_FS_020","FINAL", ttlFee,"N");
      ttlFee = feeAmount("ROW_20_001");
      removeFee("ROW_20_001", "FINAL");
      break;
    case "Curb Cut/Driveway":
      ttlFee = feeItemFormula("ROW_20_016","ROW_FS_020");
      break;
    case "Handicap Ramp":
      ttlFee = feeItemFormula("ROW_20_016","ROW_FS_020");
      break;
    case "Sidewalk":
      if(rWid<=5){
        ttlFee = rLen;
      }else{
        ttlFee = (rLen * rWid)/5;
      }
      addFee("ROW_20_001","ROW_FS_020","FINAL", ttlFee,"N");
      ttlFee = feeAmount("ROW_20_001");
      removeFee("ROW_20_001", "FINAL");
      break;
    case "Combination Curb/Gutter/Sidewalk":
      ttlFee = rLen;
      addFee("ROW_20_019","ROW_FS_020","FINAL", ttlFee,"N");
      ttlFee = feeAmount("ROW_20_019");
      removeFee("ROW_20_019", "FINAL");
      break;
    case "Asphalt Patch":
      ttlFee = rLen;
      addFee("ROW_20_017","ROW_FS_020","FINAL",ttlFee,"N");
      ttlFee = feeAmount("ROW_20_017");
      removeFee("ROW_20_017", "FINAL");
      break;
    case "Asphalt Pave":
      if(rWid<=12){
        ttlFee =  rLen;
      }else{
        ttlFee =  (rLen * rWid)/12;
      }
      addFee("ROW_20_017","ROW_FS_020","FINAL",ttlFee,"N");
      ttlFee = feeAmount("ROW_20_017");
      removeFee("ROW_20_017", "FINAL");
      break;
    case "Concrete Paving":
      if(rWid<=12){
        ttlFee = rLen;
      }else{
        ttlFee = (rLen * rWid)/12;
      }
      addFee("ROW_20_018","ROW_FS_020","FINAL",ttlFee,"N");
      ttlFee = feeAmount("ROW_20_018");
      removeFee("ROW_20_018", "FINAL");
      break;
    case "Sidewalk Drain Chase":
      ttlFee = rLen*rWid;
      addFee("ROW_20_015","ROW_FS_020","FINAL",ttlFee,"N");
      ttlFee = feeAmount("ROW_20_015");
      removeFee("ROW_20_015", "FINAL");
      break;
    case "Tree Grates":
      ttlFee = rLen*rWid;
      addFee("ROW_20_015","ROW_FS_020","FINAL",ttlFee,"N");
      ttlFee = feeAmount("ROW_20_015");
      removeFee("ROW_20_015", "FINAL");
      break;
    case "Bus Pad Street":
      ttlFee = feeItemFormula("ROW_20_024","ROW_FS_020");
      break;
    case "Bus Pad Behind Curb":
      ttlFee = feeItemFormula("ROW_20_024","ROW_FS_020");
      break;
    case "Non-Standard Inspection":
      ttlFee = feeItemFormula("ROW_20_025","ROW_FS_020");
      break; 
    }
    if(isNaN(ttlFee)) ttlFee=0;
    tblConstr[rowIndex]["Fee Calculation"]=ttlFee.toString();
    grdTtlFee += parseInt(ttlFee);
    //comment("fee total for "+ rConstr + ": " + ttlFee);
  }
  if(isNaN(grdTtlFee)) grdTtlFee=0;
  editAppSpecific("Construction Total Fee", grdTtlFee);
  if(ROWCONSTRUCTIONTABLE.length>0) {
      removeASITable("ROW CONSTRUCTION TABLE"); 
      addASITable("ROW CONSTRUCTION TABLE",tblConstr);
  }
}

function feeItemFormula (fCode, fSched) {
  arrFees = aa.finance.getFeeItemList(null,fSched,null).getOutput(); 
  for (ff in arrFees){
    if (arrFees[ff].getFeeCod() == fCode) {
      return arrFees[ff].getFormula();
    }
  }
}

function AddressUnit(thisArr)
{
  //
  // Returns an associative array of Address Attributes
  // Optional second parameter, cap ID to load from
  //

  var itemCap = capId;
  if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

  var fcapAddressObj = null;
    var capAddressResult = aa.address.getAddressWithAttributeByCapId(itemCap);
    if (capAddressResult.getSuccess())
      var fcapAddressObj = capAddressResult.getOutput();
    else
        logDebug("**ERROR: Failed to get Address object: " + capAddressResult.getErrorType() + ":" + capAddressResult.getErrorMessage())

    for (i in fcapAddressObj)
    {
      addressAttrObj = fcapAddressObj[i].getAttributes().toArray();
      for (z in addressAttrObj)
      thisArr["AddressAttribute." + addressAttrObj[z].getB1AttributeName()]=addressAttrObj[z].getB1AttributeValue();

    // Explicitly load some standard values
    // thisArr["AddressAttribute.PrimaryFlag"] = fcapAddressObj[i].getPrimaryFlag();
    // thisArr["AddressAttribute.HouseNumberStart"] = fcapAddressObj[i].getHouseNumberStart();
    // thisArr["AddressAttribute.StreetDirection"] = fcapAddressObj[i].getStreetDirection();
    // thisArr["AddressAttribute.StreetName"] = fcapAddressObj[i].getStreetName();
    // thisArr["AddressAttribute.StreetSuffix"] = fcapAddressObj[i].getStreetSuffix();
    // thisArr["AddressAttribute.City"] = fcapAddressObj[i].getCity();
    // thisArr["AddressAttribute.State"] = fcapAddressObj[i].getState();
    // thisArr["AddressAttribute.Zip"] = fcapAddressObj[i].getZip();
    // thisArr["AddressAttribute.AddressStatus"] = fcapAddressObj[i].getAddressStatus();
    // thisArr["AddressAttribute.County"] = fcapAddressObj[i].getCounty();
    // thisArr["AddressAttribute.Country"] = fcapAddressObj[i].getCountry();
    // thisArr["AddressAttribute.AddressDescription"] = fcapAddressObj[i].getAddressDescription();
    // thisArr["AddressAttribute.XCoordinate"] = fcapAddressObj[i].getXCoordinator();
    // thisArr["AddressAttribute.YCoordinate"] = fcapAddressObj[i].getYCoordinator();
                thisArr["AddressAttribute.UnitStart"] = fcapAddressObj[i].getUnitStart();
    }
}

function copyAdditionalInfo(srcCapId, targetCapId)
{
  //1. Get Additional Information with source CAPID.  (BValuatnScriptModel)
  var  additionalInfo = getAdditionalInfo(srcCapId);
  if (additionalInfo == null)
  {
    return;
  }
  //2. Get CAP detail with source CAPID.
  var  capDetail = getCapDetailByID(srcCapId);
  //3. Set target CAP ID to additional info.
  additionalInfo.setCapID(targetCapId);
  if (capDetail != null)
  {
    capDetail.setCapID(targetCapId);
  }
  //4. Edit or create additional infor for target CAP.
  aa.cap.editAddtInfo(capDetail, additionalInfo);
}

//Return BValuatnScriptModel for additional info.
function getAdditionalInfo(capId)
{
  bvaluatnScriptModel = null;
  var s_result = aa.cap.getBValuatn4AddtInfo(capId);
  if(s_result.getSuccess())
  {
    bvaluatnScriptModel = s_result.getOutput();
    if (bvaluatnScriptModel == null)
    {
      aa.print("WARNING: no additional info on this CAP:" + capId);
      bvaluatnScriptModel = null;
    }
  }
  else
  {
    aa.print("ERROR: Failed to get additional info: " + s_result.getErrorMessage());
    bvaluatnScriptModel = null; 
  }
  // Return bvaluatnScriptModel
  return bvaluatnScriptModel;
}

function getCapDetailByID(capId)
{
  capDetailScriptModel = null;
  var s_result = aa.cap.getCapDetail(capId);
  if(s_result.getSuccess())
  {
    capDetailScriptModel = s_result.getOutput();
    if (capDetailScriptModel == null)
    {
      aa.print("WARNING: no cap detail on this CAP:" + capId);
      capDetailScriptModel = null;
    }
  }
  else
  {
    aa.print("ERROR: Failed to get cap detail: " + s_result.getErrorMessage());
    capDetailScriptModel = null;  
  }
  // Return capDetailScriptModel
  return capDetailScriptModel;
}

function getParentCapIDForReview(capid)
{
    if (capid == null || aa.util.instanceOfString(capid))
    {
        return null;
    }
    //1. Get parent license for review
    var result = aa.cap.getProjectByChildCapID(capid, "Renewal", null);//"Incomplete" was "Review" 
    if(result.getSuccess())
    {
        projectScriptModels = result.getOutput();
        if (projectScriptModels == null || projectScriptModels.length == 0)
        {
            logDebug("ERROR: Failed to get parent CAP with CAPID(" + capid + ") for review");
            return null;
        }
        //2. return parent CAPID.
        projectScriptModel = projectScriptModels[0];
        return projectScriptModel;
    }  
    else 
    {
        logDebug("ERROR: Failed to get parent CAP by child CAP(" + capid + ") for review: " + result.getErrorMessage());
        return null;
    }
}

function displayReport(reportName, parameters) {

    logDebug("displayReportFromWorkflow called for report: " + reportName);
    //returns the report file which can be attached to an email.
    var report = aa.reportManager.getReportModelByName(reportName);
    report = report.getOutput();

    var permit = aa.reportManager.hasPermission(reportName, currentUserID);
    if (permit.getOutput().booleanValue()) {

        var reportResult = aa.reportManager.runReport(parameters, report);

        if (reportResult) {

            var reportOutput = reportResult.getOutput();

            showMessage = true;
            showDebug = false;

            // message is a global Accela variable. Addding the URL to it
            // pushes the request over to the web server. The regular
            // way to do this is using the comment method, but that appends a 
            // <br> tag, causing havoc on the server side.
            message += reportOutput;
            logDebug("Message from report " + message)
        } 
        else {
            logDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
            return false;
        }
    } 
    else {
        logDebug("You have no permissions to view this report.");
        return false;
    }
}

function copyNewContacts(pFromCapId, pToCapId) {
    //Copies all contacts from pFromCapId to pToCapId
    //07SSP-00037/SP5017
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
    var copied = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        var capParentContactResult = aa.people.getCapContactByCapID(pToCapId);
        if (capParentContactResult.getSuccess()) {
            capParentContact = capParentContactResult.getOutput();
            for (yy in Contacts) {
                var newContact = Contacts[yy].getCapContactModel();
                var nameMatch = false;
                for (x in capParentContact) {
                    var existingContact = capParentContact[x].getCapContactModel();
                    if (existingContact.getFirstName() == newContact.getFirstName() && existingContact.getLastName() == newContact.getLastName()) {
                        
                        nameMatch = true;
                        break;
                    }
                }
                if (nameMatch) {
                    logDebug("Names match. Not copying contact");
                    continue;
                }
                // Retrieve contact address list and set to related contact
                var contactAddressrs = aa.address.getContactAddressListByCapContact(newContact);
                if (contactAddressrs.getSuccess()) {
                    var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
                    newContact.getPeople().setContactAddressList(contactAddressModelArr);
                }
                newContact.setCapID(vToCapId);

                // Create cap contact, contact address and contact template
                aa.people.createCapContactWithAttribute(newContact);
                copied++;
                logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
            }
        }

        else {
            logMessage("**ERROR: Failed to get contacts: " + capParentContactResult.getErrorMessage());
            return false;
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
}

function addLicenseConditionCustom(cType, cStatus, cDesc, cComment, cImpact, altID) {
    var lic = getRefLicenseProf(altID);
    if (lic) {
        if (!licensedProfHasCondition(cType, cDesc, lic)) {

            addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact, altID);
        }
        else {
            logDebug("LP already has condition")
        }
    }
    else {
        logDebug("No LP on the license")
    }
}

function licensedProfHasCondition(pType, pDesc, lic) {

   
    var condResult = aa.caeCondition.getCAEConditions(lic.getLicSeqNbr());

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        aa.print("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        aa.print("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        return false;
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatusType = thisCond.getConditionStatusType();
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cType = thisCond.getConditionType();


        if (cType.toUpperCase().equals(pType.toUpperCase()) && cDesc.toUpperCase().equals(pDesc.toUpperCase())) {
            if (cStatus == "Enabled" || cStatusType == "Applied") {
                return true;
            }

        }

    }

    return false;
}

function validateLicProfLicenses(licenseNumber, licenseType, asiLicenseClassification) {

    var validLicenseTypes = lookup("Certificate2LicenseMapping", asiLicenseClassification);

    if (validLicenseTypes) {

        var validLicenseTypesArray = validLicenseTypes.split(",")

        var isValid = false;

        for (x in validLicenseTypesArray) {

            if (licenseType != null && licenseType != "" && licenseType.toUpperCase().trim().equals(validLicenseTypesArray[x].toUpperCase().trim())) {

                isValid = true;
                break;
            }

        }
        if (!isValid) {

            comment("ERROR: The Contractor License Type is not a valid type for the chosen the License Classification: " + asiLicenseClassification);
            cancel = true;
            
        }

    }

    if (licenseNumber != null && licenseNumber != "") {

        var lic = aa.licenseScript.getRefLicensesProfByLicNbr("DENVER", licenseNumber.trim()).getOutput();

        if (lic) {

            if (lic[0].getAuditStatus() != "A") {

                comment("ERROR: License has been disabled");
                cancel = true;
                
            }

            if (isAttachedToLicense(lic)) {

                comment("ERROR: This Certificate has already been associated to " + alternateId);
                cancel = true;
                
            }

            var condition = hasConditionLicenseValidation(lic[0].licSeqNbr);
            if (condition) {

                //comment("ERROR: " + condition);
                cancel = true;
               
            }

        }
        else {

            comment("Could not find License: " + licenseNumber);
            cancel = true;
            
        }

    }
}

function validateLicProfPermits(licenseNumber, licenseType) {

   

    if (licenseNumber != null && licenseNumber != "") {

        var lic = aa.licenseScript.getRefLicensesProfByLicNbr("DENVER", licenseNumber.trim()).getOutput();

        if (lic) {

            if (lic[0].getAuditStatus() != "A") {

                comment("ERROR: License has been disabled");
                cancel = true;

            }

            if (isAttachedToLicense(lic)) {

                comment("ERROR: This Certificate has already been associated to " + alternateId);
                cancel = true;

            }

            var condition = hasConditionLicenseValidation(lic[0].licSeqNbr);
            if (condition) {

                //comment("ERROR: " + condition);
                cancel = true;

            }

        }
        else {

            comment("Could not find License: " + licenseNumber);
            cancel = true;

        }

    }
}

function isAttachedToLicense(license) {

    if (appTypeArray[3] == "License") {

        var caps = aa.licenseScript.getCapIDsByLicenseModel(license[0])
        
        if (caps.getSuccess()) {

            var capIDs = caps.getOutput();
            for (x in capIDs) {

                cap = aa.cap.getCap(capIDs[x].getCapID()).getOutput();
                appTypeResult = cap.getCapType();
                appTypeString = appTypeResult.toString();
                appTypeArray = appTypeString.split("/");

                if (appTypeArray[3] == "License") {
                    thisCapId = aa.cap.getCapID(capIDs[x].getID1(), capIDs[x].getID2(), capIDs[x].getID3()).getOutput()
                    alternateId = thisCapId.getCustomID();
                    var licensedProf = aa.licenseScript.getLicenseProf(thisCapId).getOutput();
                    //for (y in license[0]) logDebug(y);
                    for (y in licensedProf) {
                        if (licensedProf[y].getLicenseNbr() == license[0].getStateLicense()) {
                            logDebug("Is Primary: " + licensedProf[y].getPrintFlag())
                            if (licensedProf[y].getPrintFlag() == "Y") {
                                return true;
                            }
                        }

                    }
                   
                }

            }

        }
        else {
            logDebug(caps.getErrorMessage())
        }
    }
    return false;
}
function hasConditionLicenseValidation(licSeqNbr) {

    var hasCondtion = false;

    if (licensedProfHasConditionBySeqNumber("Contractor Licensing", "Expired", licSeqNbr)) {

        comment("ERROR: License/Certificate has Expired.");
        hasCondtion = true;
    }
    if (licensedProfHasConditionBySeqNumber("Contractor Licensing", "Inactive", licSeqNbr)) {

        comment("ERROR: License/Certificate is Inactive.");
        hasCondtion = true;
    }
    if (licensedProfHasConditionBySeqNumber("Contractor Licensing", "Revoked", licSeqNbr)) {

        comment("ERROR: License/Certificate has been Revoked.");
        hasCondtion = true;
    }
    if (licensedProfHasConditionBySeqNumber("Contractor Licensing", "Suspended", licSeqNbr)) {

        comment("ERROR: License/Certificate is Suspended.");
        hasCondtion = true;
    }
    return hasCondtion;
}

function licensedProfHasConditionBySeqNumber(pType, pDesc, licenseSeqNo) {

    var condResult = aa.caeCondition.getCAEConditions(licenseSeqNo);

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        
        logDebug("**ERROR: getting conditions: " + condResult.getErrorMessage());
        return false;
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatusType = thisCond.getConditionStatusType();
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cType = thisCond.getConditionType();

        if (cType.toUpperCase().equals(pType.toUpperCase()) && cDesc.toUpperCase().equals(pDesc.toUpperCase())) {
            
            if (cStatus == "Enabled" || cStatusType == "Applied") {
                return true;
            }

        }

    }
    return false;
}

function licensedProfRemoveCondition(pType, removeDesc, altID) {

    var lic = getRefLicenseProf(altID);
    var condResult = aa.caeCondition.getCAEConditions(lic.getLicSeqNbr());

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        aa.print("**ERROR: getting LP conditions: " + condResult.getErrorMessage());
        return false;
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatusType = thisCond.getConditionStatusType();
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cType = thisCond.getConditionType();

        if (cType.toUpperCase().equals(pType.toUpperCase()) && removeDesc.toUpperCase().equals(removeDesc.toUpperCase())) {
            if (cStatus == "Enabled" || cStatusType == "Applied") {
                if (removeDesc == thisCond.getConditionDescription()) {
                    var removeCondition = aa.caeCondition.removeCAECondition(thisCond.getConditionNumber(), lic.getLicSeqNbr())
                    if (removeCondition.getSuccess()) {
                        logDebug("Successfully removed LP condition " + removeDesc + " from LP; " + altID)
                    }
                    else {
                        logDebug("ERROR: Was not able to remove LP condition from LP; " + altID + " Error message: " + removeCondition.getErrorMessage())
                    }
                }
            }

        }
    }
} 

function hasPrimaryLicProf() {

    var licensedProf = aa.licenseScript.getLicenseProf(capId).getOutput();
    for (y in licensedProf) {
        logDebug("Is Primary: " + licensedProf[y].getPrintFlag())
        if (licensedProf[y].getPrintFlag() == "Y") {
            return true;
        }
    }
    return false;
}
 
function processLogReviewTasks(areParallelTasksBeingActivated) {
    
    tsiArray = new Array(); 
    useTaskSpecificGroupName=true;
    loadTaskSpecific(tsiArray);
    var typeOfBidLog = getAppSpecific("Type of BID Log");
    var isResubmittal = "No";
    
    for (x in tsiArray) {
        
        var taskSpecific = x.split(".");
        
        if (taskSpecific[1] != "Application Intake") {
            continue;
        }
        if (taskSpecific[2] == "Initial Review Due Date") {
           
       continue;
        }

        var taskName = taskSpecific[2];
        var currentTaskStatus = taskStatus(taskName);
    // TFS 21719 BEGIN
    var currentTaskDueDate = getTaskDueDate(taskName);
    
    //aa.print("TASK NAME: " + taskName);
    //aa.print("CURRENT TASK STATUS: " + currentTaskStatus);
    //aa.print("CURRENT TASK DUE DATE: " + currentTaskDueDate);
    
    var initialDueDate = null;
    var today = new Date();
        if (tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"] != null) {
            var initialDueDateArray = tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"].split("/");
                initialDueDate = new Date(initialDueDateArray[2], initialDueDateArray[0] - 1, initialDueDateArray[1]);
        }
        // TFS 21719 END
       if (tsiArray[x] != "CHECKED") {
             
            continue;
        }

        logDebug("Is Checked? " + taskName + ": " + tsiArray[x]);
        
        editTaskSpecific("Application Intake", taskName, null);

        if (isTaskActive(taskName) && !areParallelTasksBeingActivated) {
            logDebug("Task is active");
           
            if (isTaskStatus(taskName, "Resubmittal Review")) {
        
                if (typeOfBidLog == "Main" || typeOfBidLog == "Residential") {
                    editTaskDueDate(taskName, dateAdd(null, 10, "Y"));
                }
                else if (typeOfBidLog == "Intermediate Residential" || typeOfBidLog == "Intermediate Commercial") {
                    editTaskDueDate(taskName, dateAdd(null, 5, "Y")); 
                }
            }
        }
        else {


            if (currentTaskStatus == "NA" || currentTaskStatus == null || currentTaskStatus == "null") {
                activateTask(taskName, "Updated via script", "Updated via script");
        if(taskName != "SUDP Review") updateTask(taskName, "Initial Review", "Updated via script", "Updated via script");// TFS 28103 updated CG 03.30.2016
        if(taskName == "SUDP Review") updateTask(taskName, "Separate Submittal Required", "Updated via script", "Updated via script");// TFS 28103 updated CG 03.30.2016
      // TFS 21719 BEGIN
          isResubmittal = "Yes";
        if (initialDueDate < today) {
           if (!matches(taskName, "Address Assignment Review", "Denver Water Review", "Erosion Control Review", "Excavation Review", "Forestry Review", "Impact Fee Review", "Landmark Review", "Parkview Review", "Project Coordinator Review", "Revocable Review", "SUDP Review", "Site Wastewater Review", "Transportation Review")) {
                       if (typeOfBidLog == "Main" || typeOfBidLog == "Residential") {
                           editTaskDueDate(taskName, dateAdd(null, 10, "Y"));                   
                        }
                        else if (typeOfBidLog == "Intermediate Residential" || typeOfBidLog == "Intermediate Commercial") {
                           editTaskDueDate(taskName, dateAdd(null, 5, "Y"));
                        }
                   continue;
           }
        }
        else {
          if (!matches(taskName, "Address Assignment Review", "Denver Water Review", "Erosion Control Review", "Excavation Review", "Forestry Review", "Impact Fee Review", "Landmark Review", "Parkview Review", "Project Coordinator Review", "Revocable Review", "SUDP Review", "Site Wastewater Review", "Transportation Review")) {
                          editTaskDueDate(taskName, dateAdd(initialDueDate, 0));
              continue;
          }
          }
      }
            // TFS 21719 END    

            // TFS 21719 BEGIN
            // else if (currentTaskStatus == "Resubmittal Review")
            //{
            //     isResubmittal = "Yes";
            //    continue;
            // }
        // TFS 21719 END
       
            else if (!matches(currentTaskStatus,"NA",null,"null","Separate Submittal Required","Initial Review")) {// TFS 28103 updated CG 03.30.2016
                    isResubmittal = "Yes";
                     activateTask(taskName, "Updated via script", "Updated via script");
                     //if(taskName != "SUDP Review") updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");// TFS 28103 updated CG 03.30.2016
                     //if(taskName == "SUDP Review") updateTask(taskName, "Separate Submittal Required", "Updated via script", "Updated via script");// TFS 28103 updated CG 03.30.2016
                     updateTask(taskName, "Resubmittal Review", "Updated via script", "Updated via script");
                
                if (!matches(taskName, "Address Assignment Review", "Denver Water Review", "Erosion Control Review", "Excavation Review", "Forestry Review", "Impact Fee Review", "Landmark Review", "Parkview Review", "Project Coordinator Review", "Revocable Review", "SUDP Review", "Site Wastewater Review", "Transportation Review")) {                
          if (currentTaskStatus != "Resubmittal Review"){
                      if (typeOfBidLog == "Main" || typeOfBidLog == "Residential") {
                          editTaskDueDate(taskName, dateAdd(null, 10, "Y"));                   
                      }
                      else if (typeOfBidLog == "Intermediate Residential" || typeOfBidLog == "Intermediate Commercial") {
                          editTaskDueDate(taskName, dateAdd(null, 5, "Y"));
                      }
           }
           else {
             editTaskDueDate(taskName, dateAdd(currentTaskDueDate,0));
           }
                   continue;
                }
            }
      // TFS 21719 BEGIN
            else if (matches(currentTaskStatus,"Separate Submittal Required","Initial Review")) {// TFS 28103 updated CG 03.30.2016
                            isResubmittal = "Yes";
                            activateTask(taskName, "Updated via script", "Updated via script");
              if (!matches(taskName, "Address Assignment Review", "Denver Water Review", "Erosion Control Review", "Excavation Review", "Forestry Review", "Impact Fee Review", "Landmark Review", "Parkview Review", "Project Coordinator Review", "Revocable Review", "SUDP Review", "Site Wastewater Review", "Transportation Review")) {
                                 editTaskDueDate(taskName, tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"]);
              }
              updateTask(taskName, currentTaskStatus, "Updated via script", "Updated via script");
                continue;
            }          
            // TFS 21719 END
           

          if (isResubmittal == "No") {
            if (matches(taskName, "DEH Review", "Access Control Review", "Architectural Review", "Electrical Review", "Plumbing Review", "Mechanical Review", "Residential Review", "Structural Review", "Fire Review", "Zoning Review")) {
                //logDebug("Initial Review Date " + tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"]);
                var initialDueDate = null;
                if (tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"] != null) {
                    var initialDueDateArray = tsiArray["DS_WF_002.Application Intake.Initial Review Due Date"].split("/");
                    initialDueDate = new Date(initialDueDateArray[2], initialDueDateArray[0] - 1, initialDueDateArray[1]);
                }
                var today = new Date();
                //logDebug(initialDueDate.toString() + " today " + today.toString());
                if (initialDueDate == null || initialDueDate < today) {
                    // Set due date from the "Paid Date"
                    var feeResult = aa.finance.getPaymentFeeItems(capId, null); 
                    
                    var paymentDate = null

                    if (feeResult.getSuccess()) {
                        var fees = feeResult.getOutput();
                        for (y in fees) {
                            feeItem = aa.finance.getFeeItemByPK(capId, fees[y].getFeeSeqNbr()).getOutput(); 
                            logDebug("Fee item code: " + feeItem.getFeeCod());
                            // if Permit Fee (Use fee schedule DS_FS_002)
                            //TODO: confirm fee item. Jason to get back to me on this
                            if (feeItem.getFeeCod() == "DS_01_001") {
                                paymentDate = fees[y].getAuditDate(); 
                                logDebug("Payment Date: " + paymentDate.getYear() + "/" + paymentDate.getMonth() + "/" + paymentDate.getDayOfMonth());
                                break;
                            }
                        }
                    }
                    else {
                        logDebug("Could not find a payment " + feeResult.getErrorMessage()); 
                    }
                    if (typeOfBidLog == "Main" || typeOfBidLog == "Residential") {
                        editTaskDueDate(taskName, dateAdd(paymentDate, 20, "Y"));
                    }
                    else if (typeOfBidLog == "Intermediate Residential" || typeOfBidLog == "Intermediate Commercial") {
                        editTaskDueDate(taskName, dateAdd(paymentDate, 10, "Y")); 
                    }
                }
                else {
                    //editTaskDueDate(taskName, dateAdd(initialDueDate, 0, "Y"));
                    if (typeOfBidLog == "Main" || typeOfBidLog == "Residential") {
                        editTaskDueDate(taskName, dateAdd(paymentDate, 20, "Y"));
                    }
                    else if (typeOfBidLog == "Intermediate Residential" || typeOfBidLog == "Intermediate Commercial") {
                        editTaskDueDate(taskName, dateAdd(paymentDate, 10, "Y")); 

                    }
                }
              }
            }
        }
    }
}

//Use this function if you are creating a report as an attachment containing fees that we added during the same event.  
function sendNotificationAsync(emailFrom, emailTo, emailCC, templateName, params, reportParams, reportName) {
   
    var scriptName = "NOTIFICATIONSENDASYNC";
  var envParameters = aa.util.newHashMap();
  
  envParameters.put("CapID",capId);
  envParameters.put("CustomCapId",capId.getCustomID());
  envParameters.put("ReportUser",currentUserID);
  envParameters.put("ServProvCode",servProvCode);
  envParameters.put("Module", appTypeArray[0]);
  envParameters.put("emailFrom", emailFrom);
  envParameters.put("emailTo", emailTo);
  envParameters.put("emailCC", emailCC);
  envParameters.put("templateName", templateName);
  envParameters.put("params", params);
  envParameters.put("reportParams", reportParams);
  envParameters.put("reportName", reportName);
  
  var result = aa.runAsyncScript(scriptName, envParameters);
  //if (result.getSuccess()) {
    //    logDebug("Email was succesfully sent")
  //}
  //else {
    //    logDebug("Warning: Email was not sent")
  //}
  
}

function processServiceOrderTasks() {

    var tasks = aa.workflow.getTasks(capId).getOutput();
    tsiArray = new Array();
    loadTaskSpecific(tsiArray);
    var inspDistrict = getGISInfo("AccelaAutomation","Neighborhood Insp Districts","DIST_NUM");
        for (x in tasks) {

        if (tasks[x].getTaskDescription() == "Application Intake") {

            activateTask("Application Intake");
            continue;
        }
        if (tasks[x].getDisposition() == "In Progress") {

            continue;
        }
        if (tsiArray[tasks[x].getTaskDescription()] == "CHECKED") {

            //set status to "In Progress"
            updateTask(tasks[x].getTaskDescription(), "In Progress", "", "")
            if (inspDistrict) {
                
                assignTask(tasks[x].getTaskDescription(), inspDistrict); 
            }
            else {
                
                updateTaskDepartment("Application Intake", "DENVER/DS/INSPECT/NA/NA/NA/NA");
            }
        }
        else {

            //Close parallel task
            closeTask(tasks[x].getTaskDescription(), "NA", "", "")
        }
    }
}
function closeServiceOrderTasks(inspectionStatus) {

    var tasks = aa.workflow.getTasks(capId).getOutput();

    for (x in tasks) {

        if (tasks[x].getTaskDescription() == "Application Intake") {

           //TFS-24871 - Begin
           setTask(tasks[x].getTaskDescription(),"N","Y");
           //closeTask(tasks[x].getTaskDescription(), inspectionStatus, "", "");
     //TFS-24871 - End            
           continue;
        }
        if (tasks[x].getDisposition() == "In Progress") {

            closeTask(tasks[x].getTaskDescription(), inspectionStatus, "", "");
        }
    }
    updateAppStatus(inspectionStatus, "");
  //TFS-25175 - Begin
  runSalesforceStatusSendAsync();
  //TFS-25175 - End

}

function closeNADBTasks(inspectionStatus) {

    var tasks = aa.workflow.getTasks(capId).getOutput();

    for (x in tasks) {
        logDebug("Is Active: " + tasks[x].getActiveFlag())
        if (tasks[x].getActiveFlag() == "Y") {

            closeTask(tasks[x].getTaskDescription(), inspectionStatus, "", "");

        }
    }
    updateAppStatus(inspectionStatus, "")

}

function editRelatedRecordCondition(ToCapId) {
    //conditionObj 

    var getToCondResult = aa.capCondition.getCapConditions(ToCapId);

    if (getToCondResult.getSuccess()) {
        toConditions = getToCondResult.getOutput();
    }
    else {
        logDebug("Error getting conditions: " + getToCondResult.getErrorMessage())
        return null;
    }

    for (y in toConditions) {

        if (conditionObj.getConditionNumber() == toConditions[y].getReferenceConditionNumber()) {

            var editCondition = conditionObj;
            editCondition.setReferenceConditionNumber(editCondition.getConditionNumber())
            editCondition.setConditionNumber(toConditions[y].getConditionNumber());
            editCondition.setConditionSource(toConditions[y].getConditionSource())
            editCondition.setCapID(toConditions[y].getCapID());
            var result = aa.capCondition.editCapCondition(editCondition);
            if (result.getSuccess()) {
                logDebug("Condition " + toConditions[y].getConditionComment() + " was updated on record ");
            }
            else {
                logDebug("Error updating condition: " + result.getErrorMessage())
            }
        }

    }
}

function deleteRelatedRecordCondition(ToCapId) {
    //conditionObj 

    var getToCondResult = aa.capCondition.getCapConditions(ToCapId);

    if (getToCondResult.getSuccess()) {
        toConditions = getToCondResult.getOutput();
    }
    else {
        logDebug("Error getting conditions: " + getToCondResult.getErrorMessage())
        return null;
    }

    for (y in toConditions) {

        if (conditionObj.getConditionNumber() == toConditions[y].getReferenceConditionNumber()) {

            var result = aa.capCondition.deleteCapCondition(ToCapId, toConditions[y].getConditionNumber());
            if (result.getSuccess()) {
                logDebug("Condition " + toConditions[y].getConditionComment() + " was deleted on record ");
            }
            else {
                logDebug("Error deleting condition: " + result.getErrorMessage())
            }
        }

    }
}
//TFS-25175 - Begin
function runSalesforceStatusSendAsync() {
    
    var scriptName = "SALESFORCESTATUSSENDASYNC";
  var envParameters = aa.util.newHashMap();
  
  envParameters.put("CapID",capId);
  envParameters.put("CustomCapId",capId.getCustomID());
  envParameters.put("ServProvCode",servProvCode);
  
  var result = aa.runAsyncScript(scriptName, envParameters);
  
}
//TFS-25175 - End

//TFS-25271 - Begin
function getNISInspId(insp2Check)
  {
  // warning, returns only the first scheduled occurrence
  var inspResultObj = aa.inspection.getInspections(capId);
  if (inspResultObj.getSuccess())
    {
    var inspList = inspResultObj.getOutput();
                
    for (xx in inspList)
         var counter = inspList.length - 1;
         if (counter = xx)
            {
      if (String(insp2Check).equals(inspList[xx].getInspectionType()))
        return inspList[xx].getIdNumber();
         }
    }
  return false;
}
//TFS-25271 - End

function printEnvParams() {
    var params = aa.env.getParamValues();
    var keys =  params.keys();
    var key = null;
    while(keys.hasMoreElements())
    {
     key = keys.nextElement();
     eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
     logDebug("Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
    }

}

function assignSUDPInspectionDepartment(dept,inspType)
{
  if(dept == null || dept == "")
    return;
    
  var inspId = getNISInspId(inspType); 
  var inspObj =  aa.inspection.getInspection(capId, inspId).getOutput();

  var inspModelObj = inspObj.getInspection();
  var inspModelActivityObj = inspModelObj.getActivity();

  // Checks to make sure the inspection is not alread assigned to a user.
  if(inspModelActivityObj.getSysUser() == null || inspModelActivityObj.getSysUser() == "")
  {
    var deptArray = dept.split("/");
    if(deptArray.length < 6)
      return;
    var newPerson = aa.person.getUser("", "", "", "", "", "", "", "", "", "", "").getOutput();
    newPerson.setServiceProviderCode("DENVER");
    newPerson.setAgencyCode(deptArray[0]);
    newPerson.setBureauCode(deptArray[1]);
    newPerson.setDivisionCode(deptArray[2]);
    newPerson.setSectionCode(deptArray[3]);
    newPerson.setGroupCode(deptArray[4]);
    newPerson.setOfficeCode(deptArray[5]);
      
    inspModelActivityObj.setSysUser(newPerson);
    inspModelObj.setActivity(inspModelActivityObj);
    aa.inspection.editInspection(inspObj);
  }
}
function getPrevNISInspId(insp2Check)
  {
  // warning, returns only the first scheduled occurrence
  var inspResultObj = aa.inspection.getInspections(capId);
  if (inspResultObj.getSuccess())
    {
    var inspList = inspResultObj.getOutput();
                
    for (xx in inspList)
         var counter = inspList.length - 1;
         if (counter = xx && counter > 0)
            { var yy = xx - 1;
       if (String(insp2Check).equals(inspList[yy].getInspectionType()))
        return inspList[yy].getIdNumber();
         }
    }
  return false;
}

function getGISInfoPrimaryGIS(svc, layer, attributename) {
   
    var distanceType = "feet";
    var retString;

    var bufferTargetResult = aa.gis.getGISType(svc, layer); // get the buffer target
    if (bufferTargetResult.getSuccess()) {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(attributename);
    }
    else { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()); return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

    for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
    {
        if (fGisObj[a1].getGISObjects()[0].getGisObjectModel().getPrimaryGISFlag() == "Y") {
            var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "0", distanceType, buf);

            if (bufchk.getSuccess())
                var proxArr = bufchk.getOutput();
            else
            { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()); return false }

            for (a2 in proxArr) {
                var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
                for (z1 in proxObj) {
                    var v = proxObj[z1].getAttributeValues()
                    retString = v[0];
                }

            }
        }
    }
    return retString
}

function proximityPrimaryGIS(svc, layer, numDistance)  // optional: distanceType
{

    var distanceType = "feet"
    if (arguments.length == 4) distanceType = arguments[3]; // use distance type in arg list

    var bufferTargetResult = aa.gis.getGISType(svc, layer); // get the buffer target
    if (bufferTargetResult.getSuccess()) {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(layer + "_ID");
    }
    else { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()); return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

    for (a1 in fGisObj) // for each GIS object on the Cap
    {
        if (fGisObj[a1].getGISObjects()[0].getGisObjectModel().getPrimaryGISFlag() == "Y") {

            var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

            if (bufchk.getSuccess())
                var proxArr = bufchk.getOutput();
            else
            { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()); return false }

            for (a2 in proxArr) {
                var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
                if (proxObj.length) {
                    return true;
                }
            }
        }
    }
    return false;
}



function addAdditionalReviewer(deptName, taskStatus, taskDueDate) {
    if (arguments.length == 3) 
    taskDue = arguments[2];
  else
    taskDue = null;
  asitArray =  new Array(); 
    //asitArray = loadASITable("ADDITIONAL EXTERNAL REVIEWS");
    asitArray = loadASITable("ADDITIONAL REVIEWERS");
    var taskArray = new Array();
    taskArray = aa.workflow.getTasks(capId).getOutput();
    newTaskName = ""; 
    reviewerName = ""; 
    reviewerEmail = ""; 
    for (x in asitArray) {
        //logDebug("Going through table " + reviewExists(taskArray, asitArray[x]["Agency Description"].fieldValue));
        var newTaskName = (""+asitArray[x]["Agency Description"].fieldValue).trim();
        var reviewerName = asitArray[x]["Reviewer Name"].fieldValue;  

        var reviewerEmail = asitArray[x]["Reviewer Email"].fieldValue; 
        var reviewDoesExist = reviewExists(taskArray, newTaskName);
        
        logDebug("Does review task exist: " + reviewDoesExist); 
        if (!reviewDoesExist) {
           
            addTask("Additional Review",newTaskName,"P"); 
            //Set task status
            updateTask(newTaskName,taskStatus,"Updated via script","Updated via script");
      if (taskDue != null)
        editTaskDueDate(newTaskName,taskDue);
            //Set dept?
            if (deptName) {
                logDebug("Setting Dept: " + deptName);
                updateTaskDepartment(newTaskName,deptName);
                //updateTaskDepartment("Application Intake","DS/PROJECTS/INTAKE/NA/NA/NA");
            }

            //Note: setting reviewer as assigned user cannot be done at this time because it is a text field. However, ther may be plans to change filed to dropdown
            // FROM CIP: Set TSI fields Reviewer Name and Email
            editTaskSpecific(newTaskName, "Reviewer Name", reviewerName); 
            editTaskSpecific(newTaskName, "Reviewer Email", reviewerEmail); 
            logDebug(newTaskName); 
            logDebug(reviewerName); 
            logDebug(reviewerEmail);
        }
    }
}



/*
* Mike Linscheid
* Updated function 12/29/2015
*/
function addAdditionalReviewer_CIP(deptName, taskStatus) {
    if (arguments.length == 3) 
    taskDue = arguments[2];
  else
    taskDue = null;
    
  asitArray =  []
  taskNameArray = []
  processedTasks = []
  userIDIssues = []
  isReviewTaskActive = false
  
    asitArray = loadASITable("ADDITIONAL REVIEWERS");
  loadWorkflowObj = aa.workflow.getTasks(capId)
  loadWorkflow = loadWorkflowObj.getSuccess() ? loadWorkflowObj.getOutput() : null
  if (loadWorkflow == null) {logDebug("***Error - Could not load workflow: " + loadWorkflowObj.getErrorMessage()); return false}
    closureStepNum = loadWorkflow[loadWorkflow.length -1].getStepNumber()
  
  for (t in loadWorkflow) if (loadWorkflow[t].getStepNumber() > closureStepNum ) taskNameArray.push(""+loadWorkflow[t].getTaskDescription())
  removeTaskList = taskNameArray.slice(0,taskNameArray.length)

    for (x in asitArray) {
        var newTaskName = (""+asitArray[x]["Agency Description"].fieldValue).trim();
        var reviewExists = taskNameArray.indexOf(newTaskName) > -1
        
        logDebug("Does '" + newTaskName + "' review task exist: " + reviewExists); 
        if (!reviewExists) {
      if (!isReviewTaskActive) {
        activateTask("Additional Review")
        isReviewTaskActive = true
      }
      logDebug("Adding Workflow Task: " + newTaskName)
            addTask("Additional Review",newTaskName,"P"); 
            //Set task status
            updateTask(newTaskName,taskStatus,"Updated via script","Updated via script");
      
      thisUser = ""+asitArray[x]["Reviewer Name"].fieldValue
      assignTo = getAAUserID(thisUser)
      switch (assignTo.length) {
      case 0:
        userIDIssues.push(thisUser+": Could not find AA User ID")
        break
      case 1:
        assignTask(newTaskName,assignTo[0])
        break
      default:
        userIDIssues.push(thisUser+": Multiple User IDs - " + assignTo.join(", "))
      }
      
      if (taskDue != null)
        editTaskDueDate(newTaskName,taskDue);

            editTaskSpecific(newTaskName, "Reviewer Name", asitArray[x]["Reviewer Name"].fieldValue); 
            editTaskSpecific(newTaskName, "Reviewer Email", asitArray[x]["Reviewer Email"].fieldValue); 
      editTaskSpecific(newTaskName, "Reviewer Phone", asitArray[x]["Reviewer Phone"].fieldValue);   //Phone Number
        }
    else{
      removeIndex = removeTaskList.indexOf(newTaskName)
      if (removeIndex > -1) removeTaskList.splice(removeIndex,1)
      else logDebug("ERROR possible duplicate task: "+ newTaskName)
    }
    }
  if (isReviewTaskActive) deactivateTask("Additional Review")
  logDebug("Workflow Tasks to be removed: " + removeTaskList)
  for (t in removeTaskList) removeTask(capId,removeTaskList[t])
  
  if (userIDIssues.length > 0) {
    showMessage = true
    logMessage(userIDIssues.join("\n"))
  }
}


/*
* Mike Linscheid
* New as of 12/29/2015
*/
function getAAUserID(user) {
  newInspector = (""+user).split(", ")
  newIDList = []
  if (newInspector.length >= 2) {
    lname = ""+newInspector.slice(0,newInspector.length -1).join(" ")
    fname = ""+newInspector.slice(-1)
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/AA");
    var conn = ds.getConnection();
    try{
      var SQL = "SELECT USER_NAME FROM PUSER WHERE SERV_PROV_CODE = 'DENVER' AND UPPER(FNAME) = ? AND UPPER(LNAME) = ?"
      var dbStmt = conn.prepareStatement(SQL);
      dbStmt.setString(1,fname.toUpperCase())
      dbStmt.setString(2,lname.toUpperCase())
      dbStmt.executeQuery();
      results = dbStmt.getResultSet()
      while (results.next()) {
        newIDList.push(results.getString("USER_NAME"))
      }
      dbStmt.close();
    }
    catch(err) {
      logDebug(err.message); 
      if (typeof dbStmt != "undefined") dbStmt.close();
    }
    conn.close()
  }
  return newIDList
}

function allScheduledROWInspAreApproved(){//counts the number of scheduled ROW inspections and compares it to the number Approved and Not Required ROW inspections and returns true or false
  var output = false; var inspCountA = 0; var inspCountB = 0; var inspCountC = 0; var inspCountD = 0; var iResult = "";
  var inspResultObj = aa.inspection.getInspections(capId);
  if(inspResultObj.getSuccess()){
    var inspList = inspResultObj.getOutput();
    for(xx in inspList){
      var iName = inspList[xx].getInspectionType();
      inspCountA = inspList.length;
      if(checkInspectionResult(iName,"Approved"))inspCountB++;
      if(checkInspectionResult(iName,"Not Required"))inspCountC++;
      if(checkInspectionResult(iName,"Pending"))inspCountD++;
    }
  }
  logDebug("Total # of Inspections: "+inspCountA+" / Approved: "+inspCountB+" / Not Required: "+inspCountC+" / Pending: "+inspCountD);
  if(inspCountA == (inspCountB+inspCountC+inspCountD))output = true;
  if(output == "false")logDebug("Not all required/scheduled inspections have been Approved");
  return output;
}
