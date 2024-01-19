import * as React from 'react';
import type { IApApprovalFormProps } from './IApApprovalFormProps';
import { FormatCurrency, GetInvoiceByStatus, MyDateFormat2, getSP } from '../../../MyHelperMethods/MyHelperMethods';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import { Stack, Dropdown, SearchBox, PrimaryButton, DefaultButton, DetailsList, IColumn, SelectionMode } from '@fluentui/react';
import { IApApprovalFormState } from './IApApprovalFormState';
import { IAPInvoiceQueryItem } from '../../../interfaces/IAPInvoiceQueryItem';

export default class ApApprovalForm extends React.Component<IApApprovalFormProps, IApApprovalFormState> {

  constructor(props: IApApprovalFormProps) {
    super(props);

    this.state = {
      awaitingApprovalInvoices: [],
      approvedInvoices: [],
      yourInvoices: [],
      selectedView: 'yourInvoices',
      showTheseInvoices: []
    };

    GetInvoiceByStatus('Awaiting Approval').then(invoices => {
      const defaultInvoices = invoices.filter(f => f.Requires_x0020_Approval_x0020_FromId?.indexOf(this.props.currentUser.Id) > -1);
      this.setState({
        awaitingApprovalInvoices: invoices,
        yourInvoices: defaultInvoices,
        showTheseInvoices: defaultInvoices
      });
    });

    GetInvoiceByStatus('Approved').then(invoices => {
      this.setState({ approvedInvoices: invoices });
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

  private _getColumns = (): IColumn[] => {
    return [
      {
        key: 'Vendor_x0020_Name',
        name: 'Vendor Name',
        fieldName: 'Vendor_x0020_Name',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Number',
        name: 'Invoice Number',
        fieldName: 'Invoice_x0020_Number',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Date',
        name: 'Received Date',
        fieldName: 'Invoice_x0020_Date',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          return <span>{MyDateFormat2(item.Invoice_x0020_Date)}</span>
        }
      },
      {
        key: 'Gross_x0020_Amount',
        name: 'Gross Amount',
        fieldName: 'Gross_x0020_Amount',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          return <span>{FormatCurrency(item.Gross_x0020_Amount)}</span>
        }
      },
      {
        key: 'PO_x0020__x0023_',
        name: 'PO #',
        fieldName: 'PO_x0020__x0023_',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Type',
        name: 'Invoice Type',
        fieldName: 'Invoice_x0020_Type',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
      {
        key: 'OData__Status',
        name: 'Status',
        fieldName: 'OData__Status',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
      {
        key: 'Title',
        name: 'Title',
        fieldName: 'Title',
        minWidth: 16,
        maxWidth: 16,
        isResizable: true,
      },
    ];
  }

  public render(): React.ReactElement<IApApprovalFormProps> {
    return (
      <div>
        <Stack horizontal horizontalAlign="space-around">
          <Stack.Item grow={1}>
            <Dropdown
              options={[{ key: 'yourInvoices', text: `Your Invoices (${this.state.yourInvoices.length})` }, { key: 'awaitingApprovalInvoices', text: `Awaiting Approval (${this.state.awaitingApprovalInvoices.length})` }, { key: 'approvedInvoices', text: `Approved (${this.state.approvedInvoices.length})` },]}
              defaultSelectedKey={this.state.selectedView}
              onChange={(e, option) => {
                let visibleInvoices: IAPInvoiceQueryItem[] = [];
                switch (option?.key) {
                  case "yourInvoices":
                    visibleInvoices = this.state.yourInvoices;
                    break;
                  case "approvedInvoices":
                    visibleInvoices = this.state.approvedInvoices;
                    break;
                  case "awaitingApprovalInvoices":
                    visibleInvoices = this.state.awaitingApprovalInvoices;
                    break;
                  default:
                    visibleInvoices = this.state.yourInvoices;
                    break;
                }

                this.setState({
                  selectedView: option?.key as string,
                  showTheseInvoices: visibleInvoices
                });
              }}
            />
          </Stack.Item>
          <Stack.Item grow={4}>
            <SearchBox placeholder="Search Invoices" />
          </Stack.Item>
        </Stack>
        <Stack horizontal horizontalAlign="space-evenly" style={{ marginTop: '5px' }}>
          <PrimaryButton text='Click to View Invoice' />
          <DefaultButton text='View All Invoices' href='https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/All.aspx' target='_blank' rel='noreferrer' />
        </Stack>
        <hr />
        <DetailsList
          items={this.state.showTheseInvoices}
          columns={this._getColumns()}
          selectionMode={SelectionMode.single}
        />
      </div>
    );
  }
}
