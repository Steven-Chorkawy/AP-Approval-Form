import * as React from 'react';
import { ActionButton, Alignment, DefaultButton, Dropdown, IDropdownOption, IPersonaProps, IconButton, MaskedTextField, Panel, PanelType, Position, PrimaryButton, ProgressIndicator, SpinButton, Stack, TextField } from '@fluentui/react';
import { IAPInvoiceQueryItem } from '../interfaces/IAPInvoiceQueryItem';
import { Form, FieldWrapper, Field, FormElement, FieldArray, FieldRenderProps, FieldArrayRenderProps } from "@progress/kendo-react-form";
import { Grid, GridCellProps, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Error } from "@progress/kendo-react-labels";
import { CreateAccountCodeLineItem, FormatCurrency, GetAccountCodes, GetChoiceColumn, GetDepartments } from '../MyHelperMethods/MyHelperMethods';
import { MyLists } from '../enums/MyLists';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { PrincipalType } from '@pnp/sp';
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IAccountCodeQueryItem } from '../interfaces/IAccountCodeQueryItem';
import { IAPInvoiceFormItem } from '../interfaces/IAPInvoiceFormItem';
import '@progress/kendo-theme-default/dist/all.css';

export interface IApprovalSidePanelProps {
    invoice: IAPInvoiceQueryItem;
    onDismiss: any;
    context: WebPartContext;
}

export interface IApprovalSidePanelState {
    chequeType: IDropdownOption[];
    departments: IDropdownOption[];
    accountCodes: IAccountCodeQueryItem[];
    APInvoice: IAPInvoiceFormItem;
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
const minValidator = (value: any): any => (value >= 0 ? "" : "Minimum units 0");
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

    // const onCancelClick = React.useCallback(
    //     (e) => {
    //         e.preventDefault();
    //         onCancel();
    //     },
    //     [onCancel]
    // );

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

        GetChoiceColumn(MyLists.Invoices, "ChequeType").then(value => {
            this.setState({
                chequeType: value.map(v => { return { key: v, text: v }; })
            });
        }).catch(reason => console.error(reason));

        GetDepartments().then(value => {
            this.setState({ departments: value.map((v: any) => { return { key: v.ID, text: v.Title }; }) })
        }).catch(reason => console.error(reason));

        GetAccountCodes(this.props.invoice.Title).then(value => {
            console.log('Account Codes Found:');
            console.log(value);
            this.setState({
                accountCodes: value,
                APInvoice: {
                    ...this.props.invoice,
                    GLAccountCodes: value
                }
            });
        }).catch(reason => console.error(reason));
    }

    private _horizontalAlignment: Alignment = "space-between";
    private _formFieldStyle = { width: '30%' };
    private _greyColor = 'rgb(204 204 204)';
    private _blueColor = 'rgb(177 191 224)';
    private _redColor = 'rgb(216 153 153)';

    private NumericTextBoxWithValidation = (fieldRenderProps: FieldRenderProps): any => {
        const { validationMessage, visited, ...others } = fieldRenderProps;
        // const { myChange } = React.useContext(FormGridEditContext);
        return (
            <div>
                <SpinButton
                    {...others}
                    label='AmountIncludingTaxes'
                    labelPosition={Position.top}
                    onChange={(event: any, newValue: string) => {
                        console.log('Spin button on change!');
                        console.log(newValue);
                        fieldRenderProps.onChange({ value: newValue })
                        // myChange({ value: Number(newValue), fieldName: 'AmountIncludingTaxes' });
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
                    validator={minValidator}
                />
            </td>
        );
    };

    private TextInputWithValidation = (fieldRenderProps: FieldRenderProps): any => {
        const { validationMessage, visited, ...others } = fieldRenderProps;
        return (
            <div>
                <MaskedTextField
                    {...others}
                    label="Account Code"
                    mask="999-99-999-99999-9999"
                    title="Enter a GL Account Code."
                />
                {visited && validationMessage && <Error>{validationMessage}</Error>}
            </div>
        );
    };

    private NameCell = (props: GridCellProps): any => {
        const { parentField, editIndex } = React.useContext(FormGridEditContext);
        const isInEdit = props.dataItem[FORM_DATA_INDEX] === editIndex;
        return (
            <td>
                <Field
                    component={isInEdit ? this.TextInputWithValidation : DisplayValue}
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
                    // DeletePCardLineItem(dataItem.ID)
                    //     .then(value => {
                    //         fieldArrayRenderProps.onRemove({
                    //             index: dataItem[FORM_DATA_INDEX],
                    //         });

                    //         setEditIndex(undefined);
                    //     })
                    //     .catch(reason => {
                    //         alert('Failed to Delete Line Item!');
                    //         console.error(reason);
                    //     });
                }
                else {
                    fieldArrayRenderProps.onRemove({
                        index: dataItem[FORM_DATA_INDEX],
                    });

                    setEditIndex(undefined);
                }
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
            setEditIndex(undefined);
        }, [fieldArrayRenderProps]);

        // const myChange = React.useCallback((dataItem): any => {
        //     // fieldArrayRenderProps.formOnChange(dataItem.fieldName, { value: dataItem.value });
        //     fieldArrayRenderProps.
        // }, []);

        const dataWithIndexes = fieldArrayRenderProps.value?.map((item: any, index: any): any => {
            return { ...item, [FORM_DATA_INDEX]: index };
        });

        return (
            <FormGridEditContext.Provider
                value={{
                    onCancel,
                    onRemove,
                    onSave,
                    // myChange,
                    editIndex,
                    parentField: name,
                }}
            >
                <Grid data={dataWithIndexes} dataItemKey={dataItemKey}>
                    <GridToolbar>
                        <DefaultButton
                            title="Add New GL Code"
                            onClick={onAdd} iconProps={{ iconName: 'Add' }}>
                            Add New GL Code
                        </DefaultButton>
                    </GridToolbar>
                    <GridColumn field="Title" title="Title" cell={this.NameCell} />
                    <GridColumn field="AmountIncludingTaxes" title="AmountIncludingTaxes" cell={this.NumberCell} />
                    <GridColumn cell={CommandCell} width={100} />
                </Grid>
            </FormGridEditContext.Provider>
        );
    }

    public render(): React.ReactElement<IApprovalSidePanelProps> {
        const handleSubmit = async (dataItem: any): Promise<any> => {
            console.log('Form Submit!');
            console.log(dataItem);
            for (let accountCodeIndex = 0; accountCodeIndex < dataItem.GLAccountCodes.length; accountCodeIndex++) {
                const accountCode = dataItem.GLAccountCodes[accountCodeIndex];
                if (!accountCode.ID) {
                    await CreateAccountCodeLineItem(accountCode);
                }
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
                        <Form
                            initialValues={{ ...this.state.APInvoice }}
                            onSubmit={handleSubmit}
                            render={(formRenderProps) => (
                                <div>
                                    <FormElement>
                                        <Stack horizontal horizontalAlign="space-evenly">
                                            <Stack.Item grow={4}>
                                                <DefaultButton style={{ width: '100%' }} href={`https://claringtonnet.sharepoint.com/sites/Finance/Invoices/${this.props.invoice.Title}`} target='_blank' rel='noreferrer' >View Files</DefaultButton>
                                            </Stack.Item>
                                            <Stack.Item grow={4}>
                                                <Stack horizontal horizontalAlign="space-evenly">
                                                    <ActionButton iconProps={{ iconName: 'CalculatorMultiply' }} label='Deny'>Deny</ActionButton>
                                                    <ActionButton iconProps={{ iconName: 'AcceptMedium' }} label='Approve'>Approve</ActionButton>
                                                    <PrimaryButton iconProps={{ iconName: 'Save' }} label='Save Changes' type='submit'>Save</PrimaryButton>
                                                </Stack>
                                            </Stack.Item>
                                        </Stack>
                                        <hr />
                                        <div style={{ backgroundColor: this._greyColor }}>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Invoice_x0020_Type"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Type"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"DepartmentId"}
                                                            component={Dropdown}
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
                                                            // defaultSelectedUsers={this.state.item.Requires_x0020_Approval_x0020_From && this.state.item.Requires_x0020_Approval_x0020_From.map(user => user.EMail)}
                                                            principalTypes={[PrincipalType.User]}
                                                            resolveDelay={1000}
                                                            component={PeoplePicker}
                                                            onChange={(e: IPersonaProps[]) => {
                                                                // MyHelper.GetUsersByLoginName(e).then(users => {
                                                                //     formRenderProps.onChange('Requires_x0020_Approval_x0020_FromId', { value: { results: [...users.map(user => { return user.Id; })] } });
                                                                // });
                                                            }}
                                                        />
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
                                                        (this field is not ready yet.)
                                                        <Field
                                                            name={"amountAllocated"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Amount Allocated"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                        </div>
                                        <div style={{ backgroundColor: this._blueColor }}>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Vendor_x0020_Name"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Vendor Name"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Vendor_x0020_Number"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Vendor ID"}
                                                            disabled={true}
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
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Invoice_x0020_Date"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Date"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Received_x0020_Date"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Received Date"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Gross_x0020_Amount"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Invoice Total (incl. tax)"}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                            <Stack horizontal horizontalAlign={this._horizontalAlignment}>
                                                <FieldWrapper style={this._formFieldStyle}>
                                                    <div className="k-form-field-wrap">
                                                        <Field
                                                            name={"Total_x0020_Tax_x0020_Amount"}
                                                            component={TextField}
                                                            labelClassName={"k-form-label"}
                                                            label={"Total Tax Amount"}
                                                            disabled={true}
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
                                                            disabled={true}
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
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </FieldWrapper>
                                            </Stack>
                                        </div>
                                        <div style={{ backgroundColor: this._redColor }}>
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
