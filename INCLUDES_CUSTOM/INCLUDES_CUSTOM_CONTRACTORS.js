aa.print("Loading INCLUDES_CUSTOM_CONTRACTORS")

function CL_PrintCopyCount(FeeItemsSeqNbrArray){
   var copies = 0;
   var currentCopies = getAppSpecific("Duplicate Copy Counter");

   if (isNaN(currentCopies) || currentCopies == null) {
	   currentCopies = 0;  
   }

   for (x in FeeItemsSeqNbrArray) {
	 feeObj = aa.finance.getFeeItemByPK(capId,FeeItemsSeqNbrArray[x]).getOutput();

     if (feeObj.getFeeCod() == "CL_GEN_001"){
         copies = copies + parseInt(feeObj.getFeeUnit());
     }
   }
   var returnCopies = parseInt(currentCopies) + copies;
   editAppSpecific("Duplicate Copy Counter", returnCopies);
}