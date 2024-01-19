import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";

export interface IApApprovalFormProps {
  description: string;
  context: WebPartContext;
  currentUser: ISiteUserInfo;
}
