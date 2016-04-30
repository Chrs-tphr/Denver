aa.print("Loading INCLUDES_CUSTOM_DEVELOPMENT")

function updatePrimaryAddressUnitNum_DEV(uNum) {
	if (matches(""+uNum,"null","","undefined")) {
		logDebug("No Unit Number, Address not updated.")
		return false
	}
	adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");
	if (adResult.getSuccess()) {
		ad = adResult.getOutput().getAddressModel();
		if (uNum != ""+ad.getUnitStart()) {
			ad.setUnitStart(uNum)
			updateAddresses(capId, ad)
		}
		else {
			logDebug("Address Unit Number has not changed.")
		}
	}
	else {
		logDebug("Could not get a primary address.")
	}
}

function addSUDPReviewInspections_DEV(task) {
	GIS_LAYER = "Electrical Insp Districts"
	GIS_ATTRIB = "INSPECTOR"
	tsiArray = []
	useTaskSpecificGroupName = true;
    loadTaskSpecific(tsiArray);
	//for( x in tsiArray) logDebug(x +": "+ tsiArray[x])
	//return
	
	tsiInsp = []
	if (task == "SUDP Review") {
		tsiInsp.push("Sanitary Sewer Inspection")
		tsiInsp.push("Post-Tie-Back Sewer Video")
		tsiInsp.push("Storm Sewer Inspection")
		tsiInsp.push("Grease Interceptor")
		tsiInsp.push("Sand/Oil Interceptor")
		tsiInsp.push("Control Manhole/Sampling Manhole or Chamber")
		tsiInsp.push("Neutralization")
		tsiInsp.push("Wastewater Final/CO")
		tsiInsp.push("Other")
		tsiInsp.push("Party-Wall Acceptance")
	}
	if ( task == "Flood Plain Review" ) {
		tsiInsp.push("Initial Floodplain")
		tsiInsp.push("Floodplain Foundation")
		tsiInsp.push("Final Floodplain")
	}	
	inspFeeQyt_SUDP = 0
	inspFeeQyt_FLOOD = 0
	for (t in tsiInsp) {
		thisTSI = "DS_WF_012." + task + "." +tsiInsp[t]
		if (tsiArray[thisTSI] == "CHECKED") {
			switch (thisTSI) {
				case "DS_WF_012.SUDP Review.Sanitary Sewer Inspection":
					createPendingInspection("D_SUDP","Sanitary Sewer Inspection")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Post-Tie-Back Sewer Video":
					createPendingInspection("D_SUDP","Post-Tie-Back Sewer Video")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Storm Sewer Inspection":
					createPendingInspection("D_SUDP","Storm Sewer Inspection")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Grease Interceptor":
					createPendingInspection("D_SUDP","Grease Interceptor")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Sand/Oil Interceptor":
					createPendingInspection("D_SUDP","Sand/Oil Interceptor")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Control Manhole/Sampling Manhole or Chamber":
					createPendingInspection("D_SUDP","Control Manhole /Sampling Manhole or Chamber")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Neutralization":
					createPendingInspection("D_SUDP","Neutralization")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Wastewater Final/CO":
					createPendingInspection("D_SUDP","Wastewater Final/CO")
					scheduleInspectDate("ROW Final/CO", dateAdd(null,1,"Y"))
					//inspectorId = ""+lookup("LOOKUP:GIS:Usernames", ""+getGISInfo("AccelaAutomation", GIS_LAYER, GIS_ATTRIB) );
					autoAssignInspection(getScheduledInspId("ROW Final/CO"))
					//if (!matches(inspectorId, "", "null", "undefined")) assignInspection(getScheduledInspId("ROW Final/CO"), inspectorId.trim().toUpperCase());
					break;
				case "DS_WF_012.SUDP Review.Other":
					createPendingInspection("D_SUDP","Other")
					inspFeeQyt_SUDP++
					break;
				case "DS_WF_012.SUDP Review.Party-Wall Acceptance":
					createPendingInspection("D_SUDP","Party-Wall Acceptance")
					break;
				case "DS_WF_012.Flood Plain Review.Initial Floodplain":
					createPendingInspection("D_FLOODPLAIN","Initial Floodplain")
					break;
				case "DS_WF_012.Flood Plain Review.Floodplain Foundation":
					createPendingInspection("D_FLOODPLAIN","Floodplain Foundation")
					break;
				case "DS_WF_012.Flood Plain Review.Final Floodplain":
					createPendingInspection("D_FLOODPLAIN","Final Floodplain")
					break;
			}
		}
	}
	if (inspFeeQyt_SUDP > 0) updateFee("DS_12_006","DS_FS_012","FINAL",inspFeeQyt_SUDP,"N")
	//Possible Flood Plain Fee in future
	//if (inspFeeQyt_FLOOD > 0) updateFee("DS_12_006","DS_FS_012","FINAL",inspFeeQyt_FLOOD,"N")
}


function isResubmittalReview_DEV(task) {
	histObj = aa.workflow.getWorkflowHistory(capId,task,null)
	if (!histObj.getSuccess()) {
		logDebug("Could not get Workflow history")
		return false
	}
	history = histObj.getOutput()
	count = 0
	for (x in history) {
		if ( history[x].getDisposition() == "Approved" ) count++
		if (count > 1) return true
	}
	return false
}


function workflowReviewsSUDP_DEV(task, status){
	reviewsCompleted = false
	//SUDP RESULTED 1ST
	if ( task == "Flood Plain Review" ) {
		if (isTaskActive("SUDP Review")) return null
		sudpStatus = taskStatus("SUDP Review")
		if (matches("Resubmittal Required", status, sudpStatus)) {
			//Activate SUDP review
			dueDate = getTaskDueDate("SUDP Review")
			activateTask("SUDP Review");
			deactivateTask("Permit Issuance")
			updateTask("SUDP Review", "In Progress","Updated via script","Updated via script");
			editTaskDueDate("SUDP Review", jsDateToASIDate(dueDate))
			return "Flood"
		}
		else if ( matches(status, "Approved", "Not Required") && matches(sudpStatus, "Approved") ) {
			reviewsCompleted = true
		}
	}
	//FLOODPLAIN RESULTED 1ST
	else if (task == "SUDP Review") {
		if (isTaskActive("Flood Plain Review")) return null
		floodStatus = taskStatus("Flood Plain Review")
		if (matches("Resubmittal Required", status, floodStatus)) {
			//Activate App Intake
			activateTask("Application Intake");
			deactivateTask("Permit Issuance")
			updateTask("Application Intake", "Awaiting Resubmittal","Updated via script","Updated via script");
			return "SUDP"
		}
		else if ( matches(status, "Approved") && matches(floodStatus, "Approved", "Not Required") ) {
			reviewsCompleted = true
		}
	}
	
	if (reviewsCompleted) {
		activateTask("Permit Issuance"); 
		updateTask("Permit Issuance", "In Progress","Updated via script","Updated via script"); 
	}
}


function invoiceAllFees_DEV() {
	feeObj = aa.finance.getFeeItemByCapID(capId)
	if (!feeObj.getSuccess()) {
		logDebug("Error getting Fee List")
		return false
	}
	feeList = feeObj.getOutput()
	for (f in feeList) {
		if (feeList[f].getFeeitemStatus() == "NEW") {
			invoiceFee(""+feeList[f].getFeeCod(), ""+feeList[f].getPaymentPeriod())
		}
	}
}


function feeTotalByStatus_DEV(feeStatus) {
	var statusArray = new Array(); 
	if (arguments.length > 0) {
		for (var i=0; i<arguments.length; i++)
			statusArray.push(arguments[i]);
	}
        
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) { 
		var feeObjArr = feeResult.getOutput(); 
		for (ff in feeObjArr) {
                        feeStatus = "" + feeObjArr[ff].getFeeitemStatus();
			if (exists(feeStatus,statusArray)) 
				feeTotal+=feeObjArr[ff].getFee();
                        
		}
	}
	else { 
		logDebug( "Error getting fee items: " + feeResult.getErrorMessage()); 
	}
	return feeTotal;
}

function createSUDPfloodplain_DEV() {
	childCap = createChild("ROW","Project", "Floodplain", "NA"); 
	childModel = aa.cap.getCap(childCap).getOutput().getCapModel()
	childModel.setSpecialText(cap.getSpecialText())
	aa.cap.editCapByPK(childModel)
	updateWorkDesc(workDescGet(capId),childCap);
	copyAppSpecific(childCap); 
	copyOwner(capId, childCap); 
	currCap = capId; 
	capId = childCap; 
	copyParcelGisObjects(); 
	closeTask("Application Intake", "Approved","Updated via script","Updated via script"); 
	updateTask("Floodplain Review", "In Progress", "Updated via script", "Updated via script"); 
	updateTaskDepartment("Application Intake", "Floodplain"); 
	capId=currCap;
}

function assignFirstReviewer(capId) {
	
	if(capId == null || capId == "")
    return;
	
	showMessage = true;
	
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	   
	try{
		var SQL = "select b.rec_ful_nam as firstreviewer from gprocess_history b, gprocess_spec_info_history c where b.serv_prov_code = c.serv_prov_code and b.b1_per_id1 = c.b1_per_id1 and b.b1_per_id2 = c.b1_per_id2 and b.b1_per_id3 = c.b1_per_id3 and b.history_id = c.b1_history_id and b.sd_pro_des = 'SUDP Review' and b.sd_app_des = 'Approved' and c.b1_checkbox_desc = 'Submittal Number' and b.sd_stp_num = c.sd_stp_num and b.b1_per_id1 || '-' || b.b1_per_id2 || '-' || b.b1_per_id3 = ?";
		var dbStmt = conn.prepareStatement(SQL);
		dbStmt.setString(1,capId);
		dbStmt.executeQuery();
		results = dbStmt.getResultSet();
		while (results.next()) {
		    var firstReviewer = results.getString("firstreviewer");
		}
		dbStmt.close();
	}
	
	catch(err) {
		logDebug(err.message); 
		if (typeof dbStmt != "undefined") dbStmt.close();
		}
	conn.close();
		
	assignTask("SUDP Review",firstReviewer);
	
}