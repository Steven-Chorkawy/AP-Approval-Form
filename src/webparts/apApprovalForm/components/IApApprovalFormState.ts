import { IAPInvoiceQueryItem } from "../../../interfaces/IAPInvoiceQueryItem";

export interface IApApprovalFormState {
    showTheseInvoices: IAPInvoiceQueryItem[]; // These are the invoices that will be rendered for the user.
    awaitingApprovalInvoices: IAPInvoiceQueryItem[];
    approvedInvoices: IAPInvoiceQueryItem[];
    yourInvoices: IAPInvoiceQueryItem[];    // Invoices that are Awaiting Approval and assigned to the current user.
    selectedView: string; // yourInvoices, approvedInvoices, or awaitingApprovalInvoices.
}
