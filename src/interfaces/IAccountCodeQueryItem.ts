/**
 * The object that is returned from SharePoint to represent GL Account Codes.
 */
export interface IAccountCodeQueryItem {
    AmountIncludingTaxes: number;   // The amount assigned to the GL account code.
    AuthorId: number;
    Created: string;
    EditorId: number;
    ID: number;
    InvoiceFOlderIDId: number; // ID of the invoice folder.
    Modified: string;
    PO_x0020_Line_x0020_Item_x0020__: string;
    StrInvoiceFolder: string;   // Title of the invoice folder.
    Title: string;  // The GL Account Code.
}

export interface IAccountCodeNewItem {
    Title: string;
    AmountIncludingTaxes: number;
    PO_x0020_Line_x0020_Item_x0020__: string;
    InvoiceFolderIDId: number;
    StrInvoiceFolder: string;
}