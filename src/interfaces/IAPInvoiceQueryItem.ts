/**
 * AP Invoice after is has been queried out of SharePoint.
 * 
 * Note: Please update 'any' properties to their correct type.
 */
export interface IAPInvoiceQueryItem {
    Adds_x0020_OK: any;
    ApprovalNotes: string;
    AuthorId: number;
    Batch_x0020_Number: any;
    ChequeReturnedNotes: any;
    ChequeType: string;
    Cheque_x0020_Number: any;
    Close: string;
    ContentTypeId: string;
    Created: string;
    DenyComment: string;
    DepartmentId: number[];
    DocumentSetDescription: string;
    EditorId: number;
    Gross_x0020_Amount: number;
    ID: number;
    Invoice_x0020_Date: string;
    Invoice_x0020_Number: string;
    Invoice_x0020_Type: string;
    IsChequeReq: boolean;
    Modified: string;
    OData__Status: string;
    PO_x0020__x0023_: string;   // PO #
    Prices_x0020_OK: any;
    Purchasing: String;
    Received_x0020_Approval_x0020_FromId: any;
    Requires_x0020_Approval_x0020_FromId: number[];
    ScannedFileName: string;
    Title: string;
    Total_x0020_Tax_x0020_Amount: number;
    Vendor_x0020_Name: string;
    Vendor_x0020_Number: string;
    Voucher_x0020_Number: any;
    ZeroDollarPayment: boolean;
}