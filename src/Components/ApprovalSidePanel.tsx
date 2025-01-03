import * as React from 'react';
import { ActionButton, Alignment, DefaultButton, Dropdown, IDropdownOption, IconButton, Label, MessageBar, MessageBarType, Panel, PanelType, Position, PrimaryButton, ProgressIndicator, SpinButton, Stack, TextField } from '@fluentui/react';
import { IAPInvoiceQueryItem } from '../interfaces/IAPInvoiceQueryItem';
import { Form, FieldWrapper, Field, FormElement, FieldArray, FieldRenderProps, FieldArrayRenderProps, FormRenderProps } from "@progress/kendo-react-form";
import { Grid, GridCellProps, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Error } from "@progress/kendo-react-labels";
import { APPROVER_LIST_MODIFIED_WORKFLOW, CreateAccountCodeLineItem, DeleteAccountCode, DeletePropertiesBeforeSave, FormatCurrency, GetAccountCodes, GetChoiceColumn, GetDepartments, GetUserByLoginName, GetUserEmails, IsInvoiceApproved, MyDateFormat2, SendDenyEmail, SumAccountCodes, UpdateApprovalEmailTrackerLineItem, getSP } from '../MyHelperMethods/MyHelperMethods';
import { MyLists } from '../enums/MyLists';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { PrincipalType } from '@pnp/sp';
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import "@pnp/sp/folders";
import "@pnp/sp/files/folder";
import { IAccountCodeQueryItem } from '../interfaces/IAccountCodeQueryItem';
import { IAPInvoiceFormItem } from '../interfaces/IAPInvoiceFormItem';
import '@progress/kendo-theme-default/dist/all.css';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import { MyFormState } from '../enums/MyFormState';
import { IFileInfo } from '@pnp/sp/files/types';
import { MaskedTextBox, MaskedTextBoxEvent } from '@progress/kendo-react-inputs';
import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';

export interface IApprovalSidePanelProps {
    invoice: IAPInvoiceQueryItem;
    onDismiss: any;
    context: WebPartContext;
    canUserEnterAccountCodes: boolean;
}

export interface IApprovalSidePanelState {
    chequeType: IDropdownOption[];
    departments: IDropdownOption[];
    accountCodes: IAccountCodeQueryItem[];
    APInvoice: IAPInvoiceFormItem;
    showApproveTextBox: boolean;
    showDenyTextBox: boolean;
    currentUser: ISiteUserInfo;
    formState: MyFormState;
    singlePDF: IFileInfo; // A preview of the single PDF file if there is only one available.
    approverListChanged: boolean; // TRUE = approver list has been modified.
}

//#region Copy Paste from Kendo. https://www.telerik.com/kendo-react-ui/components/form/field-array/
// Create React.Context to pass props to the Form Field components from the main component
export const FormGridEditContext = React.createContext<{
    onRemove: (dataItem: any) => void;
    onSave: () => void;
    onCancel: () => void;
    // myChange: (dataItem: any) => void;
    editIndex: number | undefined;
    parentField: string;
}>({} as any);

const FORM_DATA_INDEX = "formDataIndex";
const DATA_ITEM_KEY = "GLAccountCodeDataItemKey";
const DisplayValue = (fieldRenderProps: FieldRenderProps): any => { return <>{fieldRenderProps.value}</>; };
const CurrencyDisplay = (fieldRenderProps: FieldRenderProps): any => { return <>{FormatCurrency(fieldRenderProps.value)}</>; };
const CurrencyTextBox = (fieldRenderProps: FieldRenderProps): any => { return <TextField {...fieldRenderProps} value={FormatCurrency(fieldRenderProps.value)} />; }
const DisplayDateTextBox = (fieldRenderProps: FieldRenderProps): any => { return <TextField {...fieldRenderProps} value={MyDateFormat2(fieldRenderProps.value)} />; }
const requiredValidator = (value: any): any => (value ? "" : "The field is required");
// Add a command cell to Edit, Update, Cancel and Delete an item
const CommandCell = (props: GridCellProps): any => {
    const { onRemove, onSave, editIndex } = React.useContext(FormGridEditContext);
    const isInEdit = props.dataItem[FORM_DATA_INDEX] === editIndex;
    const isNewItem = !props.dataItem[DATA_ITEM_KEY];

    const onRemoveClick = React.useCallback(
        (e) => {
            e.preventDefault();
            onRemove(props.dataItem);
        },
        [props.dataItem, onRemove]
    );

    const onSaveClick = React.useCallback(
        (e) => {
            e.preventDefault();
            onSave();
        },
        [onSave]
    );

    return isInEdit ? (
        <td className="k-command-cell">
            <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-grid-save-command"
                onClick={onSaveClick}
            >
                {isNewItem ? "Add" : "Update"}
            </button>
            <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-grid-cancel-command"
                onClick={onRemoveClick}
            >
                {isNewItem ? "Cancel" : "Discard"}
            </button>
        </td>
    ) : (
        <td className="k-command-cell">
            <IconButton
                title="Delete GL Account Code"
                iconProps={{ iconName: "Delete" }}
                aria-label="Delete"
                onClick={onRemoveClick}
            />
        </td>
    );
};

export default class ApprovalSidePanel extends React.Component<IApprovalSidePanelProps, IApprovalSidePanelState> {
    constructor(props: IApprovalSidePanelProps) {
        super(props);

        this.setState({ approverListChanged: false });

        GetChoiceColumn(MyLists.Invoices, "ChequeType").then(value => {
            this.setState({
                chequeType: value.map(v => { return { key: v, text: v }; })
            });
        }).catch(reason => console.error(reason));

        GetDepartments().then(value => {
            this.setState({ departments: value.map((v: any) => { return { key: v.ID, text: v.Title }; }) })
        }).catch(reason => { console.error(reason); alert('Failed to load Departments!  Please contact helpdesk@clarington.net.') });

        this._queryInvoice();

        getSP().web.currentUser().then(user => { this.setState({ currentUser: user }) }).catch(reason => console.error(reason));

        // Check to see if a single PDF is present.  If there is only one PDF add a link directly to that file.
        getSP().web.getFolderByServerRelativePath(`Invoices/${this.props.invoice.Title}`).files().then((files: IFileInfo[]) => {
            const PDFs_FOUND = files.filter((f) => f.Name.indexOf('.pdf') !== -1);
            if (PDFs_FOUND.length === 1)
                this.setState({ singlePDF: PDFs_FOUND[0] });
        }).catch(reason => console.error(reason));
    }

    private _horizontalAlignment: Alignment = "space-between";
    private _formFieldStyle = { width: '30%' };

    private _queryInvoice = (): void => {
        // GetAccountCodes() and GetUserEmails() has to load successfully before the form will render.
        GetAccountCodes(this.props.invoice.Title).then(value => {
            GetUserEmails(this.props.invoice.Requires_x0020_Approval_x0020_FromId).then(userEmails => {
                this.setState({
                    accountCodes: value,
                    APInvoice: {
                        ...this.props.invoice,
                        GLAccountCodes: value,
                        RequiresApprovalFromUserEmails: userEmails,
                        AmountAllocated: SumAccountCodes(value)
                    },
                    showApproveTextBox: false,
                    showDenyTextBox: false,
                    formState: MyFormState.New
                });
            }).catch(reason => { console.error(reason); alert('Failed to load list of Approvers!  Please contact helpdesk@clarington.net.'); });
        }).catch(reason => { console.error(reason); alert('Failed to load Account Codes!  Please contact helpdesk@clarington.net.'); });
    }

    private DepartmentDropdown = (fieldRenderProps: FieldRenderProps): any => {
        const { options } = fieldRenderProps;
        return (
            <div>
                <Dropdown
                    options={options}
                    {...fieldRenderProps}
                    onChange={(e, option) => {
                        const currentValue = fieldRenderProps.value;
                        if (option?.selected) {
                            currentValue.push(option.key);
                        } else {
                            currentValue.splice(currentValue.indexOf(option?.key), 1);
                        }
                        fieldRenderProps.onChange({ value: currentValue });
                    }}
                />
            </div>
        );
    }

    private NumericTextBoxWithValidation = (fieldRenderProps: FieldRenderProps): any => {
        const { validationMessage, visited, ...others } = fieldRenderProps;
        // const { myChange } = React.useContext(FormGridEditContext);
        return (
            <div>
                <SpinButton
                    {...others}
                    label='Amount Including Taxes'
                    labelPosition={Position.top}
                    onChange={(event: any, newValue: string) => fieldRenderProps.onChange({ value: newValue })}
                    onValidate={(value: string, event: any) => {
                        const parsedValue = value.replace(/[^\d.-]/g, '') // strip all non numeric characters excluding decimals. https://stackoverflow.com/a/9409894
                        if (!isNaN(Number(parsedValue)) && parsedValue !== "") {
                            return parsedValue;
                        }
                        else if (parsedValue === "" && value === "") {
                            // if both parsed and input value are "" this probably means the user cleared the field. Instead of prompting the user with an error just set the value to 0. 
                            return "0";
                        }
                        else if (parsedValue === null || parsedValue === "") {
                            alert(`'${value}' is not a valid input.  Please try again.`);
                        }
                    }}
                />
                {visited && validationMessage && <Error>{validationMessage}</Error>}
            </div>
        );
    };

    private NumberCell = (props: GridCellProps): any => {
        const { parentField, editIndex } = React.useContext(FormGridEditContext);
        const isInEdit = props.dataItem[FORM_DATA_INDEX] === editIndex;

        return (
            <td>
                <Field
                    component={isInEdit ? this.NumericTextBoxWithValidation : CurrencyDisplay}
                    name={`${parentField}[${props.dataItem[FORM_DATA_INDEX]}].${props.field}`}
                />
            </td>
        );
    };

    private MaskedTextInputWithValidation = (fieldRenderProps: FieldRenderProps): any => {
        const { validationMessage, visited, ...others } = fieldRenderProps;

        return (
            <div>
                <Label required={true}>Account Code</Label>
                <MaskedTextBox
                    {...others}
                    mask="000-00-000-00000-0000"
                    title="Enter a GL Account Code."
                    required={true}
                    validationMessage='Please enter a valid GL Account Code!'
                    onBlur={(event: MaskedTextBoxEvent) => {
                        console.log('onBlur', event.target.value);
                    }}
                />
                {visited && validationMessage && <Error>{validationMessage}</Error>}
            </div>
        );
    };

    private TextFieldCell = (props: GridCellProps): any => {
        const { parentField, editIndex } = React.useContext(FormGridEditContext);
        const isInEdit = props.dataItem[FORM_DATA_INDEX] === editIndex;
        return (
            <td>
                <Field
                    label="PO Line Item #"
                    component={isInEdit ? TextField : DisplayValue}
                    name={`${parentField}[${props.dataItem[FORM_DATA_INDEX]}].${props.field}`}
                />
            </td>
        );
    }

    private NameCell = (props: GridCellProps): any => {
        const { parentField, editIndex } = React.useContext(FormGridEditContext);
        const isInEdit = props.dataItem[FORM_DATA_INDEX] === editIndex;
        return (
            <td>
                <Field
                    component={isInEdit ? this.MaskedTextInputWithValidation : DisplayValue}
                    name={`${parentField}[${props.dataItem[FORM_DATA_INDEX]}].${props.field}`}
                    validator={requiredValidator}
                />
            </td>
        );
    };

    /**
     * Custom grid component for GL Account Codes.
     * @param fieldArrayRenderProps Field Array Render Props.
     */
    private FormGrid = (fieldArrayRenderProps: FieldArrayRenderProps): any => {
        const { name, dataItemKey } = fieldArrayRenderProps;
        const [editIndex, setEditIndex] = React.useState<number | undefined>();
        const editItemCloneRef = React.useRef();

        // Add a new item to the Form FieldArray that will be shown in the Grid
        const onAdd = React.useCallback(
            (e) => {
                e.preventDefault();
                fieldArrayRenderProps.onUnshift({
                    value: {
                        ID: "",
                        InvoiceFolderIDId: fieldArrayRenderProps.invoiceID,
                        StrInvoiceFolder: fieldArrayRenderProps.invoiceTitle
                    },
                });
                setEditIndex(0);
            },
            [fieldArrayRenderProps]
        );

        // Remove a new item to the Form FieldArray that will be removed from the Grid
        const onRemove = React.useCallback(
            (dataItem) => {
                if (dataItem.ID) {
                    DeleteAccountCode(dataItem.ID).catch(reason => console.error(reason)); // No need to await.
                }

                fieldArrayRenderProps.onRemove({
                    index: dataItem[FORM_DATA_INDEX],
                });
                fieldArrayRenderProps.updateAmountAllocated();
                setEditIndex(undefined);
            },
            [fieldArrayRenderProps]
        );

        // Cancel the editing of an item and return its initial value
        const onCancel = React.useCallback(() => {
            if (editItemCloneRef.current) {
                fieldArrayRenderProps.onReplace({
                    index: editItemCloneRef.current[FORM_DATA_INDEX],
                    value: editItemCloneRef.current,
                });
            }

            editItemCloneRef.current = undefined;
            setEditIndex(undefined);
        }, [fieldArrayRenderProps]);

        // Save the changes
        const onSave = React.useCallback(() => {
            // ValidateAccountCodes(fieldArrayRenderProps.value);
            fieldArrayRenderProps.updateAmountAllocated();
            setEditIndex(undefined);
        }, [fieldArrayRenderProps]);

        const dataWithIndexes = fieldArrayRenderProps.value?.map((item: any, index: any): any => {
            return { ...item, [FORM_DATA_INDEX]: index };
        });

        return (
            <FormGridEditContext.Provider
                value={{
                    onCancel,
                    onRemove,
                    onSave,
                    editIndex,
                    parentField: name,
                }}
            >
                <br />
                <Grid data={dataWithIndexes} dataItemKey={dataItemKey}>
                    <GridToolbar>
                        {console.log('grid state', this.state)}
                        {console.log('fieldArrayRenderProps', fieldArrayRenderProps)}
                        {
                            fieldArrayRenderProps.canUserEnterAccountCodes ?
                                <div>
                                    <DefaultButton
                                        title="Add New GL Code"
                                        onClick={onAdd} iconProps={{ iconName: 'Add' }}>
                                        Add New GL Code
                                    </DefaultButton>
                                    <p>Please save the form after adding a new GL Account Code.</p>
                                </div> :
                                <MessageBar
                                    messageBarType={MessageBarType.blocked}
                                    isMultiline={true}
                                >
                                    <div>
                                        You do not have permissions to add GL Account Codes.  You will still be able to approve or deny this invoice without entering a GL Account Code.
                                    </div>
                                    <div>
                                        Please contact helpdesk@clarington.net for support with entering GL Account Codes.
                                    </div>
                                </MessageBar>
                        }
                    </GridToolbar>
                    <GridColumn field="Title" title="Account Code" cell={this.NameCell} />
                    <GridColumn field="AmountIncludingTaxes" title="Amount Including Taxes" cell={this.NumberCell} />
                    <GridColumn field="PO_x0020_Line_x0020_Item_x0020__" title="PO Line Item #" cell={this.TextFieldCell} />
                    {
                        fieldArrayRenderProps.canUserEnterAccountCodes &&
                        <GridColumn cell={CommandCell} width={100} />
                    }
                </Grid>
            </FormGridEditContext.Provider>
        );
    }

    // If a match is found this method will return false.  If no match is found this method will return true.
    private _DisableApprovalButtons = (formRenderProps?: FormRenderProps): boolean => {
        if (formRenderProps) {
            return !formRenderProps.valueGetter('Requires_x0020_Approval_x0020_FromId')?.some((f: any) => f === this.state.currentUser.Id);
        }
        else {
            // state.currentUser.ID and state.APInvoice.RequiresApprovalFromID must match. 
            return !this.state.APInvoice.Requires_x0020_Approval_x0020_FromId.some(f => f === this.state.currentUser.Id);
        }
    }

    private _triggerApprovalWorkflow = async (invoiceID: number): Promise<void> => {
        const body: string = JSON.stringify({ 'InvoiceID': invoiceID });
        const requestHeaders: Headers = new Headers();
        requestHeaders.append('Content-type', 'application/json');
        const httpClientOptions: IHttpClientOptions = {
            body: body,
            headers: requestHeaders
        };
        this.props.context.httpClient.post(
            APPROVER_LIST_MODIFIED_WORKFLOW,
            HttpClient.configurations.v1,
            httpClientOptions
        )
            .then((response: HttpClientResponse) => {
                console.log("Workflow Triggered!");
            }).catch(reason => {
                console.error('Failed to trigger approval workflow!');
                console.error(reason);
                alert('Failed to trigger approval workflow.  Please try again or notify helpdesk@clarington.net');
            });
    }

    public render(): React.ReactElement<IApprovalSidePanelProps> {
        const handleSubmit = async (dataItem: any): Promise<any> => {
            this.setState({ formState: MyFormState.InProgress });

            const INVOICE_ID: number = dataItem.ID;

            try {
                if (dataItem?.GLAccountCodes) {
                    for (let accountCodeIndex = 0; accountCodeIndex < dataItem.GLAccountCodes.length; accountCodeIndex++) {
                        const accountCode = dataItem.GLAccountCodes[accountCodeIndex];
                        if (!accountCode.ID) {
                            await CreateAccountCodeLineItem(accountCode);
                        }
                    }
                }
                const saveObj = DeletePropertiesBeforeSave(dataItem);

                await getSP().web.lists.getByTitle(MyLists.Invoices).items.getById(this.props.invoice.ID).update(saveObj);

                if (this.state.showApproveTextBox) {
                    // After invoice has been updated check to see if it is approved.  This might cause the invoice to update one more time.
                    await IsInvoiceApproved(this.props.invoice.ID);
                }

                // We only need to call the trigger method if the approver list has been modified.
                if (this.state.approverListChanged) {
                    // Call the approver list modified workflow.  
                    //This will apply item level permissions and notify users that the invoice is ready for them.
                    this._triggerApprovalWorkflow(INVOICE_ID);
                }

                this.setState({ formState: MyFormState.Complete });
                this.props.onDismiss(); // close the side panel edit form.
            } catch (error) {
                console.error(error);
                alert('Failed to Save AP Invoice.  Please refresh and try again.');
                this.setState({ formState: MyFormState.Failed });
            }
        }

        return (
            <Panel
                type={PanelType.extraLarge}
                headerText={`Invoice: ${this.props.invoice.Title}`}
                isOpen={true}
                onDismiss={this.props.onDismiss}
            >
                {this.state?.APInvoice ?
                    <div>
                        {
                            this.state.formState === MyFormState.InProgress &&
                            <div>
                                <ProgressIndicator label="Saving Invoice..." />
                            </div>
                        }
                        <Form
                            initialValues={{ ...this.state.APInvoice }}
                            onSubmit={handleSubmit}
                            render={(formRenderProps) => (
                                <div>
                                    <FormElement>
                                        <Stack horizontal horizontalAlign="space-evenly">
                                            <Stack.Item grow={4}>
                                                <DefaultButton style={{ width: '100%' }} href={`https://claringtonnet.sharepoint.com/sites/Finance/Invoices/${this.props.invoice.Title}`} target='_blank' data-interception="off">View All Files</DefaultButton>
                                                {
                                                    this.state.singlePDF &&
                                                    <DefaultButton style={{ width: '100%', marginTop: '5px' }} href={`${this.state.singlePDF.ServerRelativeUrl.replace(this.state.singlePDF.Name, encodeURIComponent(this.state.singlePDF.Name))}`} target='_blank' data-interception="off">View {this.state.singlePDF.Name}</DefaultButton>
                                                }
                                                <DefaultButton style={{ width: '100%', marginTop: '5px' }} href={`https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/All.aspx?FilterField1=Vendor_x0020_Name&FilterValue1=${encodeURIComponent(this.state.APInvoice.Vendor_x0020_Name)}&FilterType1=Text`} target='_blank' data-interception="off">View More from {this.state.APInvoice.Vendor_x0020_Name}</DefaultButton>
                                            </Stack.Item>
                                            <Stack.Item grow={4}>
                                                <Stack horizontal horizontalAlign="space-evenly">
                                                    <ActionButton
                                                        iconProps={{ iconName: 'CalculatorMultiply' }}
                                                        label='Deny'
                                                        onClick={() => this.setState({ showDenyTextBox: true, showApproveTextBox: false })}
                                                        disabled={this.state.formState !== MyFormState.New || this._DisableApprovalButtons(formRenderProps)}
                                                    >
                                                        Deny
                                                    </ActionButton>
                                                    <ActionButton
                                                        iconProps={{ iconName: 'AcceptMedium' }}
                                                        label='Approve'
                                                        onClick={() => this.setState({ showDenyTextBox: false, showApproveTextBox: true })}
                                                        disabled={this.state.formState !== MyFormState.New || this._DisableApprovalButtons(formRenderProps)}
                                                    >
                                                        Approve
                                                    </ActionButton>
                                                    <PrimaryButton
                                                        iconProps={{ iconName: 'Save' }}
                                                        label='Save Changes'
                                                        type='submit'
                                                        disabled={this.state.formState !== MyFormState.New || !formRenderProps.allowSubmit}
                                                    >Save</PrimaryButton>
                                                </Stack>
                                            </Stack.Item>
                                        </Stack>
                                        <hr />
                                        {
                                            this.state.showApproveTextBox &&
                                            <Stack>
                                                <MessageBar messageBarType={MessageBarType.success} isMultiline={true} style={{ width: '50%' }}>
                                                    <Field
                                                        name={"ApprovalNotes"}
                                                        component={TextField}
                                                        multiline={6}
                                                        required={false}
                                                        labelClassName={"k-form-label"}
                                                        label={"Comments (Optional)"}
                                                    />
                                                </MessageBar>
                                                <PrimaryButton
                                                    iconProps={{ iconName: 'AcceptMedium' }}
                                                    label='Click to Approve Invoice'
                                                    type='submit'
                                                    style={{ width: '50%', marginLeft: 'auto', marginRight: 'auto' }}
                                                    disabled={this.state.formState !== MyFormState.New}
                                                    onClick={(e) => {
                                                        const newValue = this.state.APInvoice?.Received_x0020_Approval_x0020_FromId ? [...this.state.APInvoice?.Received_x0020_Approval_x0020_FromId, this.state.currentUser.Id] : [this.state.currentUser.Id];
                                                        formRenderProps.onChange('Received_x0020_Approval_x0020_FromId', { value: newValue });
                                                        UpdateApprovalEmailTrackerLineItem(this.state.currentUser.Email, this.state.APInvoice.Title);
                                                    }}
                                                >Click to Save & Approve Invoice</PrimaryButton>
                                                <br />
                                            </Stack>
                                        }
                                        {
                                            this.state.showDenyTextBox &&
                                            <Stack>
                                                <MessageBar messageBarType={MessageBarType.error} isMultiline={true} style={{ width: '50%' }}>
                                                    <Field
                                                        name={"DenyComment"}
                                                        component={TextField}
                                                        multiline={6}
                                                        required={true}
                                                        labelClassName={"k-form-label"}
                                                        label={"Why are you denying this invoice?"}
                                                    />
                                                </MessageBar>
                                                <PrimaryButton
                                                    iconProps={{ iconName: 'CalculatorMultiply' }}
                                                    label='Click to Deny Invoice'
                                                    type='submit'
                                                    style={{ width: '50%', marginLeft: 'auto', marginRight: 'auto' }}
                                                    disabled={this.state.formState !== MyFormState.New}
                                                    onClick={() => {
                                                        formRenderProps.onChange('Received_x0020_Deny_x0020_From_x0020_String', { value: `${this.state.APInvoice.Received_x0020_Deny_x0020_From_x0020_String}${this.state.currentUser.Email};` })
                                                        formRenderProps.onChange('OData__Status', { value: 'Received' });
                                                        SendDenyEmail(this.props.context, this.state.APInvoice.Invoice_x0020_Number, this.state.currentUser.Email, this.state.APInvoice.Title, formRenderProps.valueGetter('DenyComment'))
                                                    }}
                                                >Click to Save & Deny Invoice</PrimaryButton>
                                                <br />
                                            </Stack>
                                        }
                                        <div>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Invoice_x0020_Type"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Type"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"DepartmentId"}
                                                            component={this.DepartmentDropdown}
                                                            labelClassName={"k-form-label"}
                                                            label={"Department"}
                                                            placeholder={'Select Department'}
                                                            multiSelect={true}
                                                            options={this.state?.departments}
                                                            defaultSelectedKeys={this.props.invoice.DepartmentId}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name='Requires_x0020_Approval_x0020_FromId'
                                                            context={this.props.context}
                                                            personSelectionLimit={10}
                                                            titleText={'Requires Approval From'}
                                                            defaultSelectedUsers={this.state.APInvoice.RequiresApprovalFromUserEmails}
                                                            principalTypes={[PrincipalType.User]}
                                                            resolveDelay={1000}
                                                            component={PeoplePicker}
                                                            onChange={(items: any[]) => {
                                                                this.setState({ approverListChanged: true });
                                                                GetUserByLoginName(items)
                                                                    .then(value => formRenderProps.onChange('Requires_x0020_Approval_x0020_FromId', { value: value }))
                                                                    .catch(reason => console.error(reason));
                                                            }}
                                                        />
                                                        <div>Approved By: {this.props.invoice.Received_x0020_Approval_x0020_From}</div>
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack>
                                                <FieldWrapper>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"DocumentSetDescription"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Notes"}
                                                            multiline
                                                            rows={3}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"AmountAllocated"}
                                                            component={CurrencyTextBox}
                                                            labelClassName={"k-form-label"}
                                                            label={"Amount Allocated"}
                                                            readOnly={true} title={'Read Only'} />
                                                        {
                                                            (formRenderProps.valueGetter('AmountAllocated') !== formRenderProps.valueGetter('Gross_x0020_Amount')) &&
                                                            <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
                                                                The amount allocated ({FormatCurrency(formRenderProps.valueGetter('AmountAllocated'))}) does not equal invoice total ({FormatCurrency(formRenderProps.valueGetter('Gross_x0020_Amount'))})!
                                                            </MessageBar>
                                                        }
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                        </div>
                                        <div>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Vendor_x0020_Name"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Vendor Name"}
                                                            readOnly={true} title={'Read Only'} />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Vendor_x0020_Number"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Vendor ID"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Invoice_x0020_Number"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Number"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Invoice_x0020_Date"}
                                                            component={DisplayDateTextBox}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Date"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Received_x0020_Date"}
                                                            component={DisplayDateTextBox}
                                                            labelClassName={"k-form-label"}
                                                            label={"Received Date"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Gross_x0020_Amount"}
                                                            component={CurrencyTextBox}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Total (incl. tax)"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Total_x0020_Tax_x0020_Amount"}
                                                            component={CurrencyTextBox}
                                                            labelClassName={"k-form-label"}
                                                            label={"Total Tax Amount"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"PO_x0020__x0023_"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"PO #"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"close"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Close"}
                                                            readOnly={true} title={'Read Only'}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                        </div>
                                        <div>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Prices_x0020_OK"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Prices OK"}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Adds_x0020_OK"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Adds OK"}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"ChequeType"}
                                                            component={Dropdown}
                                                            labelClassName={"k-form-label"}
                                                            label={"Cheque Type"}
                                                            options={this.state?.chequeType}
                                                            placeholder='Select Cheque Type'
                                                            defaultSelectedKey={this.props.invoice.ChequeType}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldArray
                                                    name="GLAccountCodes"
                                                    dataItemKey={DATA_ITEM_KEY}
                                                    invoiceID={formRenderProps.valueGetter('ID')}
                                                    invoiceTitle={formRenderProps.valueGetter('Title')}
                                                    canUserEnterAccountCodes={this.props.canUserEnterAccountCodes}
                                                    updateAmountAllocated={() => formRenderProps.onChange('AmountAllocated', { value: SumAccountCodes(formRenderProps.valueGetter('GLAccountCodes')) })}
                                                    component={this.FormGrid}
                                                />
                                            </Stack>
                                        </div>
                                    </FormElement>
                                </div>
                            )}
                        />
                    </div> :
                    <div>
                        <ProgressIndicator label="Loading Invoice" />
                    </div>
                }
            </Panel>
        );
    }
}
