function SendEmailCorrespondence(TemplateName, capIdObject, licenseObject)
{
    aa.print("Sending Email Notification for " + TemplateName);
    
    capId = aa.cap.getCapID(capIdObject.getID1(),capIdObject.getID2(),capIdObject.getID3()).getOutput();
    cap = aa.cap.getCap(capId).getOutput();
    altId = capId.getCustomID();

    appTypeResult = cap.getCapType();
    appTypeString = appTypeResult.toString();
    appTypeArray = appTypeString.split("/");
    busname = cap.getSpecialText();

    insuranceExpirationDate = null;
    if (getAppSpecific("Insurance Expiration Date") != undefined) {
        insuranceExpirationDate = getAppSpecific("Insurance Expiration Date");

    }

    aa.print(appTypeArray[0] + "/" + appTypeArray[1]);
    addressForTemplate = null;
    addressType = null;
    if (matches(appTypeArray[0], "Licenses") && matches(appTypeArray[1], "Individual")) {
        aa.print("Individual License");
        addressType = "Individual";
        var capContactResult = aa.people.getCapContactByCapID(capId);
        if (capContactResult.getSuccess()) {
            var Contacts = capContactResult.getOutput();
            contactType = "Applicant";
            for (x in Contacts)
                if (contactType.equals(Contacts[x].getCapContactModel().getPeople().getContactType())) {
                    addressForTemplate = Contacts[x].getPeople().getCompactAddress();
                }
            }
        }
        else {

            addressType = "Business";
            addressResult = aa.address.getAddressByCapId(capId);
            if (addressResult.getSuccess()) {
                address = addressResult.getOutput();
                var hasPrimary = false;
                var count = 0;
                for (x in address) {
                    count++;
                    if (address[x].getPrimaryFlag() == "Y") {
                        hasPrimary = true;
                        addressForTemplate = address[x];
                    }
                }
                if (count > 0 && !hasPrimary) {
                    //take the first one
                    addressForTemplate = address[0];
            }
        }
    }
   
    if (TemplateName == 'Renewal') {
        vEmailSubject = "RENEWAL NOTICE FOR A PROFESSIONAL LICENSE";
        vEmailText = renewEmailTemplate(addressForTemplate, altId, appTypeString, busname, licenseObject.b1ExpDate, insuranceExpirationDate, addressType);
        aa.print(vEmailText);
    }
    if (TemplateName == 'Expiration') {
        vEmailSubject = "EXPIRATION NOTICE FOR A BUSINESS LICENSE";
        vEmailText = expireEmailTemplate(addressForTemplate, altId, appTypeString, busname, licenseObject.b1ExpDate, addressType);
        aa.print(vEmailText);
    }
    if (TemplateName == 'Expiration90') {
        vEmailSubject = "EXPIRATION NOTICE FOR A BUSINESS LICENSE";
        vEmailText = expire90EmailTemplate(addressForTemplate, altId, appTypeString, busname, licenseObject.b1ExpDate, addressType);
        aa.print(vEmailText);
    }
    emailContactCustom(vEmailSubject, vEmailText, "Applicant")
    
}

function renewEmailTemplate(addressObject, businessFileNumber, licenseType, businessName, permitExpirationDate, insuranceExpirationDate, addressType) {

    if (addressObject) {
        var address = null;
        var city = addressObject.getCity() || "";
        //var county = addressObject.getCounty() || "";
        var state = addressObject.getState() || "";
        var zip = addressObject.getZip() || "";

        if (addressType == "Business") {
            var houseNumber = addressObject.getHouseNumberStart() || "";
            var street = addressObject.getStreetName() || "";
            var suffix = addressObject.getStreetSuffix() || "";
            address = houseNumber + " " + street + " " + suffix 
        }
        else {
            address = addressObject.getAddressLine1();
        }
    }
    emailTemplateText = '<p>BUSINESS FILE NUMBER: ' + businessFileNumber + '</p>';
    emailTemplateText += '<p>NOTICE DATE: ' + sysDateMMDDYYYY + '</p>';
    emailTemplateText += '<p>LICENSE TYPE: ' + licenseType + '</p>'; // CAP detail description field
    if (businessName != "") {
      if (addressType == "Business") {                                            
        emailTemplateText += '<p>BUSINESS NAME: ' + businessName + '</p>';
      }
      else {                                                                     
        emailTemplateText += '<p>' + businessName + '</p>';                          
      }                                                                          
    }
    emailTemplateText += address + '<br>';
    emailTemplateText += city + '<br>';
    //emailTemplateText += county + '<br>';
    emailTemplateText += state + '<br>';
    emailTemplateText += zip + '<br>';
    emailTemplateText += '<p>IMPORTANT: YOUR CURRENT LICENSE WILL EXPIRE ON: ' + permitExpirationDate + '</p>';
    emailTemplateText += '<p>This notice is to be returned with your remittance to the above address on or before the expiration date to avoid late charges. Renewal will not be granted until all ordinance requirements are met.</p>';
    emailTemplateText += '<p>Should this notice fail to reflect any business type or profession for which a license is required, please advise the Department of Excise and Licenses by indicating any additional license types needed with your remittance. </p>';
    emailTemplateText += '<p>Name and location will appear on the license exactly as it appears above. If any portion of the name and address is incorrect, indicate those corrections with your remittance.</p>';
    emailTemplateText += '<p>If you are no longer in business, notify our office so we may clear our records.</p>';
    emailTemplateText += '<p>OUR RECORDS INDICATE THAT YOU ARE CURRENTLY LICENSED AS FOLLOWS:.<br>';
    emailTemplateText += licenseType + '</p>';

    emailTemplateText += '<p>PENALTY CLAUSE (OTHER THAN LIQUOR OR MASSAGE ESTABLISHMENT(S)):</p>';
    emailTemplateText += '<p>A 20% PENALTY WILL BE CHARGED DURING THE FIRST 30 DAYS OF THE 90-DAY GRACE PERIOD. FOR DAYS 31-90 OF THAT GRACE PERIOD A 50% PENALTY WILL BE CHARGED AS PERMITTED UNDER THE DRMC CHAPTER 32. THEREAFTER, LICENSEES WILL BE REQUIRED TO APPLY AS NEW. </p>';
    emailTemplateText += '<p>A. IF REMITTANCE IS MAILED, IT MUST BE POSTMARKED ON OR BEFORE THE EXPIRATION DATE.<br>';
    emailTemplateText += 'B. MAKE CHECKS PAYABLE TO MANAGER OF FINANCE.</p>';
    emailTemplateText += '<p>Sincerely,</p>';
    emailTemplateText += '<p></p>';
    emailTemplateText += '<p>Department of Excise and Licenses</p>';

    return emailTemplateText;

}

function expireEmailTemplate(addressObject, businessFileNumber, licenseType, businessName, permitExpirationDate, addressType) {

    if (addressObject) {
        var address = null;
        var city = addressObject.getCity() || "";
        //var county = addressObject.getCounty() || "";
        var state = addressObject.getState() || "";
        var zip = addressObject.getZip() || "";

        if (addressType == "Business") {
            var houseNumber = addressObject.getHouseNumberStart() || "";
            var street = addressObject.getStreetName() || "";
            var suffix = addressObject.getStreetSuffix() || "";
            address = houseNumber + " " + street + " " + suffix
        }
        else {
            address = addressObject.getAddressLine1() || "";
        }
    }

    businessName = businessName || "";

    emailTemplateText = '<p>BUSINESS FILE NUMBER: ' + businessFileNumber + '</p>';
    emailTemplateText += '<p>NOTICE DATE: ' + sysDateMMDDYYYY + '</p>';
    emailTemplateText += '<p>LICENSE TYPE: ' + licenseType + '</p>'; // CAP detail description field
    if (businessName != "") {
      if (addressType == "Business") {                                              
        emailTemplateText += '<p>BUSINESS NAME: ' + businessName + '</p>';
      }
      else {                                                                       
        emailTemplateText += '<p>' + businessName + '</p>';                            
      }                                                                            
    }
    emailTemplateText += address + '<br>';
    emailTemplateText += city + '<br>';
    //emailTemplateText += county + '<br>';
    emailTemplateText += state + '<br>';
    emailTemplateText += zip + '<br>';
    emailTemplateText += '<p>Dear Licensee,</p>';
    emailTemplateText += '<p>IMPORTANT: YOUR CURRENT LICENSE EXPIRES TODAY ON: ' + permitExpirationDate + '</p>'; //Accela Expiration date on the Renewal tab
    emailTemplateText += '<p>You must renew your license to lawfully remain in business.</p>';
    emailTemplateText += '<p>If your license is expired, you have a ninety (90) day grace period to renew your license.</p>';
    emailTemplateText += '<p>The penalty for renewing within thirty (30) days after the date of your license expiration is twenty percent (20%) of the annual license fee.</p>';
    emailTemplateText += '<p>The penalty for renewing within thirty-one (31) to ninety (90) days after the date of your license expiration is fifty percent (50%) of the annual license fee.</p>';
    emailTemplateText += '<p>If you do not renew your license within ninety (90) days of expiration, your current license will be invalid and you must apply for a new license.</p>';
    emailTemplateText += '<p>Licenses for liquor, cabaret, marijuana, and massage establishments may have additional renewal requirements.</p>';
    emailTemplateText += '<p>If you are no longer in business, please notify our office so we may update our records.</p>';
   // emailTemplateText += '<p></p>';
    emailTemplateText += '<p>Sincerely,</p>';
    emailTemplateText += '<p></p>';
    emailTemplateText += '<p>Department of Excise and Licenses</p>';
    //todate
    return emailTemplateText;
}

function expire90EmailTemplate(addressObject, businessFileNumber, licenseType, businessName, permitExpirationDate, addressType) {

    if (addressObject) {
        var address = null;
        var city = addressObject.getCity() || "";
        //var county = addressObject.getCounty() || "";
        var state = addressObject.getState() || "";
        var zip = addressObject.getZip() || "";

        if (addressType == "Business") {
            var houseNumber = addressObject.getHouseNumberStart() || "";
            var street = addressObject.getStreetName() || "";
            var suffix = addressObject.getStreetSuffix() || "";
            address = houseNumber + " " + street + " " + suffix
        }
        else {
            address = addressObject.getAddressLine1() || "";
        }
    }

    businessName = businessName || "";

    emailTemplateText = '<p>BUSINESS FILE NUMBER: ' + businessFileNumber + '</p>';
    emailTemplateText += '<p>NOTICE DATE: ' + sysDateMMDDYYYY + '</p>';
    emailTemplateText += '<p>LICENSE TYPE: ' + licenseType + '</p>'; // CAP detail description field
    if (businessName != "") {
      if (addressType == "Business") {                                              
        emailTemplateText += '<p>BUSINESS NAME: ' + businessName + '</p>';
      }
      else {                                                                       
        emailTemplateText += '<p>' + businessName + '</p>';                            
      }                                                                            
    }
    emailTemplateText += address + '<br>';
    emailTemplateText += city + '<br>';
    //emailTemplateText += county + '<br>';
    emailTemplateText += state + '<br>';
    emailTemplateText += zip + '<br>';
    emailTemplateText += '<p>IMPORTANT: YOUR BUSINESS LICENSE HAS EXPIRED AS OF ' + permitExpirationDate + '</p>'; //Accela Expiration date on the Renewal tab
    emailTemplateText += '<p>A license renewal can no longer be filed for this business. Business licenses that have lapsed will be treated as new applicants. If you wish to continue doing business and are required to be licensed by the City and County of Denver, you must reapply as a new business and provide all required supporting documentation.</p>';
    emailTemplateText += '<p>Thank you for your attention to this matter.</p>';
   // emailTemplateText += '<p></p>';
    emailTemplateText += '<p>Sincerely,</p>';
    emailTemplateText += '<p></p>';
    emailTemplateText += '<p>Department of Excise and Licenses</p>';
    //todate
    return emailTemplateText;
}

function emailContactCustom(mSubj, mText)   // optional: Contact Type, default Applicant
{
    var replyTo = "noreply@accela.com";
    var contactType = "Applicant"
    var emailAddress = "";

    if (arguments.length == 3) contactType = arguments[2]; // use contact type specified

    var capContactResult = aa.people.getCapContactByCapID(capId);
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts)
            if (contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType()))
                if (Contacts[yy].getEmail() != null)
                    emailAddress = "" + Contacts[yy].getEmail();
    }
    aa.print("Email Address " + emailAddress);
    if (emailAddress.indexOf("@") > 0) {
        aa.sendMail(replyTo, emailAddress, "", mSubj, mText);
        aa.print("Successfully sent email to " + contactType);
    }
    else
        aa.print("Couldn't send email to " + contactType + ", no valid email address");
}
