import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";
import { MyLists } from "../enums/MyLists";
import { IAPInvoiceQueryItem } from "../interfaces/IAPInvoiceQueryItem";

let _sp: SPFI;

export const getSP = (context?: WebPartContext): SPFI => {
    if (context) {
        _sp = spfi().using(SPFx(context as ISPFXContext));
    }
    return _sp;
};


export const GetAwaitingApprovalInvoices = async (): Promise<IAPInvoiceQueryItem[]> => {
    const invoices = await getSP().web.lists.getByTitle(MyLists.Invoices).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><Eq><FieldRef Name="_Status"/><Value Type="Choice">Awaiting Approval</Value></Eq></Where></Query></View>` });

    return invoices;
}