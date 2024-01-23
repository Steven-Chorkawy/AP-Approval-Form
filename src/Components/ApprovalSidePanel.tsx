import * as React from 'react';
import { ActionButton, Alignment, DefaultButton, Dropdown, IDropdownOption, IPersonaProps, Panel, PanelType, PrimaryButton, Stack, TextField } from '@fluentui/react';
import { IAPInvoiceQueryItem } from '../interfaces/IAPInvoiceQueryItem';

import { Form, FieldWrapper, Field } from "@progress/kendo-react-form";
import { GetChoiceColumn, GetDepartments } from '../MyHelperMethods/MyHelperMethods';
import { MyLists } from '../enums/MyLists';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { PrincipalType } from '@pnp/sp';
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";

export interface IApprovalSidePanelProps {
    invoice: IAPInvoiceQueryItem;
    onDismiss: any;
    context: WebPartContext;
};

export interface IApprovalSidePanelState {
    chequeType: IDropdownOption[];
    departments: IDropdownOption[];
}

export default class ApprovalSidePanel extends React.Component<IApprovalSidePanelProps, IApprovalSidePanelState> {

    constructor(props: IApprovalSidePanelProps) {
        super(props);
        GetChoiceColumn(MyLists.Invoices, "ChequeType").then(value => {
            this.setState({
                chequeType: value.map(v => { return { key: v, text: v }; })
            });
        });

        GetDepartments().then(value => {
            this.setState({ departments: value.map((v: any) => { return { key: v.ID, text: v.Title }; }) })
        });
    }

    private _horizontalAlignment: Alignment = "space-between";
    private _formFieldStyle = { width: '30%' };
    private _greyColor = 'rgb(204 204 204)';
    private _blueColor = 'rgb(177 191 224)';
    private _redColor = 'rgb(216 153 153)';


    public render(): React.ReactElement<IApprovalSidePanelProps> {
        return (
            <Panel
                type={PanelType.extraLarge}
                headerText={`Invoice: ${this.props.invoice.Title}`}
                isOpen={true}
                onDismiss={this.props.onDismiss}
            >
                <div>
                    <Form
                        initialValues={{ ...this.props.invoice }}
                        onSubmit={(submitValue) => {
                            console.log('submit value');
                            console.log(submitValue);
                        }}
                        render={(formRenderProps) => (
                            <div>
                                <Stack horizontal horizontalAlign="space-evenly">
                                    <Stack.Item grow={4}>
                                        <DefaultButton style={{ width: '100%' }} href={`https://claringtonnet.sharepoint.com/sites/Finance/Invoices/${this.props.invoice.Title}`} target='_blank' rel='noreferrer' >View Files</DefaultButton>
                                    </Stack.Item>
                                    <Stack.Item grow={4}>
                                        <Stack horizontal horizontalAlign="space-evenly">
                                            <ActionButton iconProps={{ iconName: 'CalculatorMultiply' }} label='Deny'>Deny</ActionButton>
                                            <ActionButton iconProps={{ iconName: 'AcceptMedium' }} label='Approve'>Approve</ActionButton>
                                            <PrimaryButton iconProps={{ iconName: 'Save' }} label='Approve'>Save</PrimaryButton>
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
                                                (this field isn't ready yet.)
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
                                                />
                                            </div>
                                        </FieldWrapper>
                                    </Stack>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </Panel>
        );
    }
}
