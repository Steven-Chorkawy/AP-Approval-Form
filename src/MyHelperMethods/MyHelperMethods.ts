import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields";
import "@pnp/sp/items/get-all";
import "@pnp/sp/items";

import { MyLists } from "../enums/MyLists";
import { IAPInvoiceQueryItem } from "../interfaces/IAPInvoiceQueryItem";
import { IAccountCodeNewItem, IAccountCodeQueryItem } from "../interfaces/IAccountCodeQueryItem";

let _sp: SPFI;

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
//#endregion