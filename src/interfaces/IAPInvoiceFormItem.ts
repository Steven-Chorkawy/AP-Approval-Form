import { IAccountCodeQueryItem } from "./IAccountCodeQueryItem";

/**
 * The object that represents an AP Invoice while it is in the form.
 */
export interface IAPInvoiceFormItem {
    Adds_x0020_OK: any;
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
    Purchasing: String;
    Received_x0020_Date: string;
    Received_x0020_Approval_x0020_FromId: any;
    Requires_x0020_Approval_x0020_FromId: number[];
    ScannedFileName: string;
    Title: string;
    Total_x0020_Tax_x0020_Amount: number;
    Vendor_x0020_Name: string;
    Vendor_x0020_Number: string;
    Voucher_x0020_Number: any;
    ZeroDollarPayment: boolean;
    GLAccountCodes: IAccountCodeQueryItem[];
}