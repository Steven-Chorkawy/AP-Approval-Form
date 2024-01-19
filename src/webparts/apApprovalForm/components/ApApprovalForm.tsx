import * as React from 'react';
import type { IApApprovalFormProps } from './IApApprovalFormProps';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IPersonaProps } from '@fluentui/react';
import { getSP } from '../../../MyHelperMethods/MyHelperMethods';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";

export default class ApApprovalForm extends React.Component<IApApprovalFormProps, {}> {

  /**
   *
   */
  constructor(props: IApApprovalFormProps) {
    super(props);
    getSP().web.siteUsers().then(value => {
      console.log('All Site Users');
      console.log(value);

      console.log('IsShareByEmailGuestUser = false');
      console.log(value.filter(f => f.IsShareByEmailGuestUser === true));

      console.log('@cplma.ca emails');
      console.log(value.filter(f => f.Email.indexOf('@cplma.ca') > -1));
    });
  }
  //  private _sp = getSP(this.props.context);

  public render(): React.ReactElement<IApApprovalFormProps> {
    return (
      <div>
        <h1>Select Library Staff</h1>
        <hr />
        <PeoplePicker
          context={this.props.context}
          titleText="People Picker"
          personSelectionLimit={3}
          //groupName={"AP Invoice Account"} // Leave this blank in case you want to filter from all users
          // groupId={440}
          showtooltip={true}
          // required={true}
          // disabled={true}
          searchTextLimit={3}
          onChange={(e: IPersonaProps[]) => {
            console.log(e.length);
            for (let index = 0; index < e.length; index++) {
              const user: any = e[index];

              getSP().web.siteUsers.getByLoginName(user.id)().then(value => {
                console.log(`Index: ${index}`);
                console.log('Testing User: ');
                console.log(user);

                console.log(value);
              });
            }
          }}
          // showHiddenInUI={false}
          principalTypes={[PrincipalType.User]}
        // resolveDelay={1000}
        />
      </div>
    );
  }
}
