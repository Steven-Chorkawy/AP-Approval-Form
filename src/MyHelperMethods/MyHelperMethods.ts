import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPFI, SPFx, spfi } from "@pnp/sp";

let _sp: SPFI;

export const getSP = (context?: WebPartContext): SPFI => {
    if (_sp === null && context !== null) {
        _sp = spfi().using(SPFx(context as WebPartContext));
    }
    return _sp;
};
