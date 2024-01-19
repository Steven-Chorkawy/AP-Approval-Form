import * as React from 'react';
import type { IApApprovalFormProps } from './IApApprovalFormProps';
import { GetAwaitingApprovalInvoices, getSP } from '../../../MyHelperMethods/MyHelperMethods';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import { Stack, Dropdown, SearchBox, PrimaryButton, DefaultButton } from '@fluentui/react';
import { IApApprovalFormState } from './IApApprovalFormState';

export default class ApApprovalForm extends React.Component<IApApprovalFormProps, IApApprovalFormState> {

  /**
   *
   */
  constructor(props: IApApprovalFormProps) {
    super(props);

    this.state = {
      awaitingApprovalInvoices: []
    };

    GetAwaitingApprovalInvoices().then(invoices => {
      this.setState({ awaitingApprovalInvoices: invoices });
    });

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
        <Stack horizontal horizontalAlign="space-around">
          <Stack.Item grow={2}>
            <Dropdown
              options={[{ key: 'Your Invoices', text: 'Your Invoices' }, { key: 'Awaiting Approval', text: `Awaiting Approval (${this.state.awaitingApprovalInvoices.length})` }, { key: 'Approved', text: 'Approved' },]}
              defaultSelectedKey={'Your Invoices'}
            />
          </Stack.Item>
          <Stack.Item grow={3}>
            <SearchBox placeholder="Search Invoices" />
          </Stack.Item>
        </Stack>
        <Stack horizontal horizontalAlign="space-evenly" style={{ marginTop: '5px' }}>
          <PrimaryButton text='Click to View Invoice' />
          <DefaultButton text='View All Invoices' href='https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/All.aspx' target='_blank' rel='noreferrer' />
        </Stack>
      </div>
      // <div>
      //   <h1>Select Library Staff</h1>
      //   <hr />
      //   <PeoplePicker
      //     context={this.props.context}
      //     titleText="People Picker"
      //     personSelectionLimit={3}
      //     //groupName={"AP Invoice Account"} // Leave this blank in case you want to filter from all users
      //     // groupId={440}
      //     showtooltip={true}
      //     // required={true}
      //     // disabled={true}
      //     searchTextLimit={3}
      //     onChange={(e: IPersonaProps[]) => {
      //       console.log(e.length);
      //       for (let index = 0; index < e.length; index++) {
      //         const user: any = e[index];

      //         getSP().web.siteUsers.getByLoginName(user.id)().then(value => {
      //           console.log(`Index: ${index}`);
      //           console.log('Testing User: ');
      //           console.log(user);

      //           console.log(value);
      //         });
      //       }
      //     }}
      //     // showHiddenInUI={false}
      //     principalTypes={[PrincipalType.User]}
      //   // resolveDelay={1000}
      //   />
      // </div>
    );
  }
}
