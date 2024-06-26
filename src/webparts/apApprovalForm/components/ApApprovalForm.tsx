import * as React from 'react';
import type { IApApprovalFormProps } from './IApApprovalFormProps';
import { FormatCurrency, GetInvoiceByStatus, MyDateFormat2, getSP } from '../../../MyHelperMethods/MyHelperMethods';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import { Stack, Dropdown, SearchBox, DefaultButton, DetailsList, IColumn, SelectionMode, MessageBar, MessageBarType } from '@fluentui/react';
import { IApApprovalFormState } from './IApApprovalFormState';
import { IAPInvoiceQueryItem } from '../../../interfaces/IAPInvoiceQueryItem';
import { filterBy } from '@progress/kendo-data-query';
import ApprovalSidePanel from '../../../Components/ApprovalSidePanel';
import PackageSolutionVersion from '../../../Components/PackageSolutionVersion';
import { MyLists } from '../../../enums/MyLists';
import { PermissionKind } from '@pnp/sp/security';


export default class ApApprovalForm extends React.Component<IApApprovalFormProps, IApApprovalFormState> {

  constructor(props: IApApprovalFormProps) {
    super(props);

    this.state = {
      awaitingApprovalInvoices: [],
      approvedInvoices: [],
      yourInvoices: [],
      selectedView: 'yourInvoices',
      showTheseInvoices: [],
      searchFilter: "",
      canUserEnterAccountCodes: false
    };

    // Check if the user has access to create Account Codes. 
    getSP().web.lists.getByTitle(MyLists.InvoiceAccountCodes).currentUserHasPermissions(PermissionKind.AddListItems)
      .then(value => this.setState({ canUserEnterAccountCodes: value }))
      .catch(reason => {
        alert('Failed to get user permissions');
        console.error(reason);
      })

    this._queryInvoices();
  }

  private _queryInvoices = (): void => {
    GetInvoiceByStatus('Awaiting Approval').then(invoices => {
      const defaultInvoices = invoices.filter(f => f.Requires_x0020_Approval_x0020_FromId?.indexOf(this.props.currentUser.Id) > -1);
      this.setState({
        awaitingApprovalInvoices: invoices,
        yourInvoices: defaultInvoices,
      });
      this._applySearchFilter();
    }).catch(reason => console.error(reason));

    GetInvoiceByStatus('Approved').then(invoices => {
      this.setState({ approvedInvoices: invoices });
      this._applySearchFilter();
    }).catch(reason => console.error(reason));
  }

  private _getColumns = (): IColumn[] => {
    return [
      {
        key: 'Title',
        name: 'Title',
        fieldName: 'Title',
        minWidth: 200,
        maxWidth: 200,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          return <span><DefaultButton title='Click to View and Approve Invoice.' onClick={() => { this.setState({ selectedRow: item }) }}>{item.Title}</DefaultButton></span>
        }
      },
      {
        key: 'RequiresApprovalFrom',
        name: 'Requires Approval From',
        fieldName: 'Requires_x0020_Approval_x0020_FromId',
        minWidth: 200,
        maxWidth: 200,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          try {
            return (
              <div>
                {
                  item.Requires_x0020_Approval_x0020_From.split(';').map(req => {
                    if (req === '') {
                      return <div></div>;// return an empty div.
                    }
                    else if (item.Received_x0020_Approval_x0020_From.split(';').indexOf(req) >= 0) {
                      return <div title={`${req} - Approved`}><MessageBar messageBarType={MessageBarType.success} isMultiline={false}>{req}</MessageBar></div>;
                    }
                    else {
                      return <div title={`${req} - Awaiting Approval`}><MessageBar messageBarType={MessageBarType.info} isMultiline={false}>{req}</MessageBar></div>;
                    }
                  })
                }
              </div >
            );
          } catch (error) {
            console.error(error);
            return <div>FAILED TO LOAD APPROVERS!</div>;
          }
        }
      },
      {
        key: 'Vendor_x0020_Name',
        name: 'Vendor Name',
        fieldName: 'Vendor_x0020_Name',
        minWidth: 150,
        maxWidth: 200,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Number',
        name: 'Invoice Number',
        fieldName: 'Invoice_x0020_Number',
        minWidth: 150,
        maxWidth: 400,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Date',
        name: 'Received Date',
        fieldName: 'Invoice_x0020_Date',
        minWidth: 150,
        maxWidth: 500,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          return <span>{MyDateFormat2(item.Invoice_x0020_Date)}</span>
        }
      },
      {
        key: 'Gross_x0020_Amount',
        name: 'Gross Amount',
        fieldName: 'Gross_x0020_Amount',
        minWidth: 150,
        maxWidth: 500,
        isResizable: true,
        onRender: (item: IAPInvoiceQueryItem) => {
          return <span>{FormatCurrency(item.Gross_x0020_Amount)}</span>
        }
      },
      {
        key: 'PO_x0020__x0023_',
        name: 'PO #',
        fieldName: 'PO_x0020__x0023_',
        minWidth: 150,
        maxWidth: 500,
        isResizable: true,
      },
      {
        key: 'Invoice_x0020_Type',
        name: 'Invoice Type',
        fieldName: 'Invoice_x0020_Type',
        minWidth: 100,
        maxWidth: 500,
        isResizable: true,
      },
      {
        key: 'OData__Status',
        name: 'Status',
        fieldName: 'OData__Status',
        minWidth: 100,
        maxWidth: 500,
        isResizable: true,
      },
    ];
  }

  private _applySearchFilter = (): void => {
    let visibleInvoices: IAPInvoiceQueryItem[] = [];

    switch (this.state.selectedView) {
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

    const searchBoxFilterObj: any = {
      logic: "or",
      filters: [
        { field: 'Title', operator: 'contains', value: this.state.searchFilter },
        { field: 'Vendor_x0020_Number', operator: 'contains', value: this.state.searchFilter },
        { field: 'Vendor_x0020_Name', operator: 'contains', value: this.state.searchFilter },
        { field: 'Invoice_x0020_Number', operator: 'contains', value: this.state.searchFilter },
        { field: 'PO_x0020__x0023_', operator: 'contains', value: this.state.searchFilter },
        { field: 'Batch_x0020_Number', operator: 'contains', value: this.state.searchFilter },
      ]
    };

    const filteredInvoices = filterBy(visibleInvoices, searchBoxFilterObj);

    this.setState({ showTheseInvoices: filteredInvoices });
  }

  public render(): React.ReactElement<IApApprovalFormProps> {
    return (
      <div style={{ marginRight: '20px', marginLeft: '20px' }} >
        <Stack horizontal horizontalAlign="space-around">
          <Stack.Item grow={1}>
            <Dropdown
              options={[{ key: 'yourInvoices', text: `Your Invoices (${this.state.yourInvoices.length})` }, { key: 'awaitingApprovalInvoices', text: `Awaiting Approval (${this.state.awaitingApprovalInvoices.length})` }, { key: 'approvedInvoices', text: `Approved (${this.state.approvedInvoices.length})` },]}
              defaultSelectedKey={this.state.selectedView}
              onChange={(e, option) => {
                this.setState({ selectedView: option?.key as string }, () => { this._applySearchFilter() });
              }}
            />
          </Stack.Item>
          <Stack.Item grow={4}>
            <SearchBox
              placeholder="Search Invoices"
              onChange={(event, newValue?: string) => {
                this.setState({ searchFilter: newValue }, () => { this._applySearchFilter() });
              }}
            />
          </Stack.Item>
        </Stack>
        <Stack horizontal horizontalAlign="space-evenly" style={{ marginTop: '5px' }}>
          <DefaultButton text='View All Invoices' href='https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/All.aspx' target='_blank' data-interception="off" />
        </Stack>
        <hr />
        <DetailsList
          items={this.state.showTheseInvoices}
          columns={this._getColumns()}
          compact={true}
          onShouldVirtualize={() => { return false; }} // If users complain about slow loading we can try updating this. At the moment setting this to TRUE prevents all items from rendering. 
          selectionMode={SelectionMode.none}
        />

        {
          this.state.selectedRow &&
          <ApprovalSidePanel
            invoice={this.state.selectedRow}
            onDismiss={() => {
              this.setState({ selectedRow: undefined });
              this._queryInvoices();
            }}
            context={this.props.context}
            canUserEnterAccountCodes={this.state.canUserEnterAccountCodes}
          />
        }
        <br />
        <PackageSolutionVersion />
      </div >
    );
  }
}
