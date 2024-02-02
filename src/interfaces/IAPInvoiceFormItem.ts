import { IAccountCodeQueryItem } from "./IAccountCodeQueryItem";

/**
 * The object that represents an AP Invoice while it is in the form.
 */
export interface IAPInvoiceFormItem {
    Adds_x0020_OK: any;
    AmountAllocated: number; // Custom field that is a sum of all the account code amounts.
    ApprovalNotes: string;
    Batch_x0020_Number: any;
    ChequeReturnedNotes: any;
    ChequeType: string;
    Cheque_x0020_Number: any;
    Close: string;
    DenyComment: string;
    DepartmentId: number[];
    DocumentSetDescription: string;
    Gross_x0020_Amount: number;
    Invoice_x0020_Date: string;
    Invoice_x0020_Number: string;
    Invoice_x0020_Type: string;
    IsChequeReq: boolean;
    OData__Status: string;
    PO_x0020__x0023_: string;   // PO #
    Prices_x0020_OK: any;
    Purchasing: string;
    Received_x0020_Date: string;
    Received_x0020_Approval_x0020_FromId: number[];
    Requires_x0020_Approval_x0020_FromId: number[];
    Received_x0020_Deny_x0020_From_x0020_String: string; // Comma separated emails of users who have denied the current invoice.
    RequiresApprovalFromUserEmails?: string[];
    ScannedFileName: string;
    Title: string;
    Total_x0020_Tax_x0020_Amount: number;
    Vendor_x0020_Name: string;
    Vendor_x0020_Number: string;
    Voucher_x0020_Number: any;
    ZeroDollarPayment: boolean;
    GLAccountCodes?: IAccountCodeQueryItem[];
}