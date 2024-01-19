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

export const GetInvoiceByStatus = async (status: string): Promise<IAPInvoiceQueryItem[]> => {
    const output = await getSP().web.lists.getByTitle(MyLists.Invoices).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><Eq><FieldRef Name="_Status"/><Value Type="Choice">${status}</Value></Eq></Where></Query></View>` });
    console.log(`GetInvoiceByStatus: ${status}`);
    console.log(output);
    return output;
}


//#region Format
export const FormatCurrency = (i: number): string => {
    return i.toLocaleString('en-US', { style: 'currency', currency: 'USD', });
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
//#endregion