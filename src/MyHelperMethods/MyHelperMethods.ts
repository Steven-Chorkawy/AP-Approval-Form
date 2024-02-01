import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields";
import "@pnp/sp/items/get-all";
import "@pnp/sp/items";

import { MyLists } from "../enums/MyLists";
import { IAPInvoiceQueryItem } from "../interfaces/IAPInvoiceQueryItem";
import { IAccountCodeNewItem, IAccountCodeQueryItem } from "../interfaces/IAccountCodeQueryItem";
import { HttpClient, IHttpClientOptions } from '@microsoft/sp-http';


let _sp: SPFI;

const DENY_WORKFLOW_URL = "https://prod-02.canadacentral.logic.azure.com:443/workflows/d675bc40225a4e7a8bb257ba94c9106f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=H57-SJXbNldB0C4sYV7hWo2QP4FB-EJaMP0gMBn3XsM";

export const getSP = (context?: WebPartContext): SPFI => {
    if (context) {
        _sp = spfi().using(SPFx(context as ISPFXContext));
    }
    return _sp;
};

export const GetInvoiceByStatus = async (status: string): Promise<IAPInvoiceQueryItem[]> => {
    const output = await getSP().web.lists.getByTitle(MyLists.Invoices).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><Eq><FieldRef Name="_Status"/><Value Type="Choice">${status}</Value></Eq></Where></Query></View>` });
    return output;
}

export const GetChoiceColumn = async (listTitle: string, columnName: string): Promise<string[]> => {
    const sp = getSP();
    try {
        const choiceColumn: any = await sp.web.lists.getByTitle(listTitle).fields.getByTitle(columnName).select('Choices')();
        return choiceColumn.Choices;
    } catch (error) {
        console.error('Something went wrong in GetChoiceColumn!');
        console.error(error);
        return [];
    }
};

export const GetDepartments = async (): Promise<any> => {
    return await getSP().web.lists.getByTitle(MyLists.Departments).items.select('Title, ID').getAll();
}

export const GetAccountCodes = async (folderName: string): Promise<IAccountCodeQueryItem[]> => {
    const output = await getSP().web.lists.getByTitle(MyLists.InvoiceAccountCodes).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><Eq><FieldRef Name="StrInvoiceFolder"/><Value Type="Text">${folderName}</Value></Eq></Where></Query></View>` });
    return output;
}

export const GetUserEmails = async (userIDs: number[]): Promise<string[]> => {
    const output: string[] = [];
    for (let approverIDIndex = 0; approverIDIndex < userIDs.length; approverIDIndex++) {
        const user = await getSP().web.getUserById(userIDs[approverIDIndex])();
        output.push(user.Email);
    }
    return output;
}

export const GetUserByLoginName = async (input: any[]): Promise<number[]> => {
    const output: number[] = [];
    for (let index = 0; index < input.length; index++) {
        const currentUser = input[index];
        const user = await getSP().web.siteUsers.getByLoginName(currentUser.loginName)();
        output.push(user.Id);
    }
    return output;
}

export const CreateAccountCodeLineItem = async (value: IAccountCodeNewItem): Promise<any> => {
    // value.Title sometimes contains '_' as the last character.   I don't know why.  Remove it here. 
    if (value.Title.slice(-1) === '_') {
        value.Title = value.Title.slice(0, -1);
    }

    await getSP().web.lists.getByTitle(MyLists.InvoiceAccountCodes).items.add({
        Title: value.Title,
        AmountIncludingTaxes: Number(value.AmountIncludingTaxes),
        PO_x0020_Line_x0020_Item_x0020__: value.PO_x0020_Line_x0020_Item_x0020__,
        InvoiceFolderIDId: value.InvoiceFolderIDId,
        StrInvoiceFolder: value.StrInvoiceFolder
    });
}

export const UpdateApprovalEmailTrackerLineItem = async (userEmail: string, invoiceTitle: string): Promise<void> => {
    const currentTrackers = await getSP().web.lists.getByTitle(MyLists.ApprovalEmailTracker).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><And><Eq><FieldRef Name="Title"/><Value Type="Text">${invoiceTitle}</Value></Eq><Eq><FieldRef Name="ApproverEmail"/><Value Type="Text">${userEmail}</Value></Eq></And></Where></Query></View>` });
    for (let index = 0; index < currentTrackers.length; index++) {
        const element = currentTrackers[index];
        getSP().web.lists.getByTitle(MyLists.ApprovalEmailTracker).items.getById(element.ID).update({ Approved: true });
    }
}

/**
 * Check to see if the current invoice has been approved by all users.
 * The queried invoice will contain two list of user IDs. Received_x0020_Approval_x0020_FromId and Requires_x0020_Approval_x0020_FromId.  
 * When all the values in both arrays are the same the invoice can be approved.
 */
export const IsInvoiceApproved = async (invoiceID: number): Promise<boolean> => {
    const invoice = await getSP().web.lists.getByTitle(MyLists.Invoices).items.getById(invoiceID)();
    const receivedApprovals = invoice.Received_x0020_Approval_x0020_FromId;
    const requiresApprovals = invoice.Requires_x0020_Approval_x0020_FromId;

    if (receivedApprovals === null) {
        return false;
    }
    if (requiresApprovals === null) {
        return false;
    }
    if (requiresApprovals.length !== receivedApprovals.length) {
        return false;
    }

    let isInvoiceApproved = true; // Initialize this variable to true.  The following for loop will set this to false if need be.
    for (let index = 0; index < requiresApprovals.length; index++) {
        const requiresApprovalID = requiresApprovals[index];
        if (!receivedApprovals.includes(requiresApprovalID)) {
            isInvoiceApproved = false;
        }
    }

    if (isInvoiceApproved) {
        await getSP().web.lists.getByTitle(MyLists.Invoices).items.getById(invoiceID).update({ "OData__Status": "Approved" });
        return true;
    }

    return false;
}

export const SumAccountCodes = (accounts: IAccountCodeQueryItem[] | undefined): number => {
    if (accounts === undefined) {
        return 0;
    }

    let total: number = 0;
    for (let index = 0; index < accounts.length; index++) {
        const account: IAccountCodeQueryItem = accounts[index];
        total += Number(account.AmountIncludingTaxes);
    }

    return total;
}

/**
 * Trigger a workflow that sends an email to the Purchasing department. 
 * https://make.powerautomate.com/environments/Default-2c663e0f-310e-40c2-a196-f341569885a9/flows/b3dadd3b-d312-4731-a60a-45538762cdbb/details
 */
export const SendDenyEmail = async (context: WebPartContext, invoiceNumber: string, denyUserEmail: string, invoiceTitle: string, denyComment: string): Promise<any> => {
    const workflowBody = {
        "InvoiceNumber": invoiceNumber,
        "UserEmail": denyUserEmail,
        "Title": invoiceTitle,
        "Comment": denyComment
    };

    const body: string = JSON.stringify(workflowBody);
    const requestHeaders: Headers = new Headers();
    requestHeaders.append("Content-type", "application/json");
    const httpClientOptions: IHttpClientOptions = {
        body: body,
        headers: requestHeaders
    };

    return await context.httpClient.post(DENY_WORKFLOW_URL, HttpClient.configurations.v1, httpClientOptions);
}

//#region Format
export const FormatCurrency = (i: number): string => {
    if (i)
        return i.toLocaleString('en-US', { style: 'currency', currency: 'USD', });
    else
        return 'Bad Number!';
}

/**
 * Format date as full month name, date, and full year. 
 * EX: January 1, 2024
 * @param i Date as string
 * @returns Formatted date as a string.
 */
export const MyDateFormat1 = (i: string): string => {
    return new Date(i).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Format date as yyyy-mm-dd
 * EX: 2024-01-01
 * @param i Date as string
 * @returns Formatted date as a string.
 */
export const MyDateFormat2 = (i: string): string => {
    return new Date(i).toISOString().slice(0, 10);
}

/**
 * Remove fields that do not need to be/ cannot be saved in SharePoint.
 * @param invoice The invoice object from the form.
 */
export const DeletePropertiesBeforeSave = (invoice: any): any => {
    delete invoice.AmountAllocated;
    delete invoice.RequiresApprovalFromUserEmails;
    delete invoice.GLAccountCodes;
    delete invoice.Id;
    delete invoice.ID;
    delete invoice.OData__ColorTag;
    delete invoice.DateandTime;
    delete invoice.ContentTypeId;
    //delete invoice.Received_x0020_Approval_x0020_FromId;
    delete invoice.Requires_x0020_Approval_x0020_From;
    delete invoice.Received_x0020_Approval_x0020_From;
    delete invoice.Requires_x0020_Approval_x0020_FromStringId;
    delete invoice.Received_x0020_Approval_x0020_FromStringId;
    // delete invoice.Received_x0020_Deny_x0020_From_x0020_String;
    delete invoice.HiddenApproversId;
    delete invoice.HiddenApproversStringId;
    delete invoice.HiddenDepartmentId;
    delete invoice.SharedWithUsersId;
    delete invoice.GUID;
    delete invoice.CheckoutUserId;
    delete invoice.ComplianceAssetId;
    delete invoice.IsApproved;
    delete invoice.MediaServiceKeyPoints;
    delete invoice.MediaServiceAutoTags;
    delete invoice.MediaServiceLocation;
    delete invoice.MediaServiceOCR;
    delete invoice.OData__CopySource;
    delete invoice.ServerRedirectedEmbedUri;
    delete invoice.ServerRedirectedEmbedUrl;
    delete invoice.SharedWithDetails;
    delete invoice.AccountAmount1;
    delete invoice.AuthorId;
    delete invoice.Created;
    //delete invoice.DocumentSetDescription;
    delete invoice.EditorId;
    delete invoice.FileSystemObjectType;
    delete invoice.Modified;
    delete invoice.OData__UIVersionString;
    delete invoice.ScannedFileName;
    delete invoice.Title;
    delete invoice.saveSuccess;
    delete invoice.OData__ip_UnifiedCompliancePolicyProperties;
    delete invoice.MediaServiceImageTags;
    // delete invoice.Received_x0020_Approval_x0020_FromId;
    delete invoice['odata.editLink'];
    delete invoice['odata.etag'];
    delete invoice['odata.id'];
    delete invoice['odata.type'];

    // Only delete Requires_x0020_Approval_x0020_FromId if the results property is missing. 
    // If results property is missing that means this field has not been modified.
    // if (invoice.Requires_x0020_Approval_x0020_FromId === null || !invoice.Requires_x0020_Approval_x0020_FromId.hasOwnProperty('results')) {
    //   delete invoice.Requires_x0020_Approval_x0020_FromId;
    // }
    // if (invoice.Received_x0020_Approval_x0020_FromId === null || !invoice.Received_x0020_Approval_x0020_FromId.hasOwnProperty('results')) {
    //   delete invoice.Received_x0020_Approval_x0020_FromId;
    // }

    return invoice;
}

export const DeleteAccountCode = async (id: number): Promise<void> => {
    try {
        await getSP().web.lists.getByTitle(MyLists.InvoiceAccountCodes).items.getById(id).delete();
    } catch (error) {
        console.error(error);
        alert('Failed to delete GL Account Code!  Please refresh this page and try again.');
    }
}
//#endregion