import * as React from 'react';
import type { IApApprovalFormProps } from './IApApprovalFormProps';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

export default class ApApprovalForm extends React.Component<IApApprovalFormProps, {}> {
  public render(): React.ReactElement<IApApprovalFormProps> {

    return (
      <div>
        <h1>Select Library Staff</h1>
        <hr />
        <PeoplePicker
          context={this.props.context}
          titleText="People Picker"
          personSelectionLimit={3}
          // groupName={"Team Site Owners"} // Leave this blank in case you want to filter from all users
          showtooltip={true}
          // required={true}
          // disabled={true}
          searchTextLimit={3}
          // onChange={this._getPeoplePickerItems}
          // showHiddenInUI={false}
          principalTypes={[PrincipalType.User]}
          // resolveDelay={1000}
        />
      </div>
    );
  }
}
