import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";

let _sp: SPFI;

export const getSP = (context?: WebPartContext): SPFI => {
    if (context) {
        _sp = spfi().using(SPFx(context as ISPFXContext));
    }
    return _sp;
};
