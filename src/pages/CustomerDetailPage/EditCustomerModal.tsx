import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CustomerData {
    storeName: string;
    clientFirstName: string;
    clientLastName: string;
    email: string;
    primaryContact: string;
    gstNumber: string;
    clientType: string;
    otherClientType?: string;
    addressLine1: string;
    addressLine2: string;
    district?: string;
    subDistrict?: string;
    city: string;
    state: string;
    pincode: string;
    village?: string;
    taluka?: string;
}

interface EditCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerData: CustomerData | null;
    onSubmit: (data: CustomerData) => void;
}

const defaultFormData: CustomerData = {
    storeName: '',
    clientFirstName: '',
    clientLastName: '',
    email: '',
    primaryContact: '',
    gstNumber: '',
    clientType: '',
    otherClientType: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    taluka: '',
    city: '',
    state: '',
    pincode: '',
};

const standardClientTypes = ["shop", "site visit", "architect", "engineer"];

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, customerData, onSubmit }) => {
    const [activeTab, setActiveTab] = useState("basic-info");
    const [formData, setFormData] = useState<CustomerData>(defaultFormData);
    const [isOtherClientType, setIsOtherClientType] = useState(false);
    const nonEditableFieldStyle = "bg-gray-100 text-gray-800 font-medium cursor-not-allowed";

    useEffect(() => {
        if (customerData) {
            const clientType = customerData.clientType?.toLowerCase() || '';
            const isStandardType = standardClientTypes.includes(clientType);

            setFormData({
                ...defaultFormData,
                ...customerData,
                village: customerData.district || '',
                taluka: customerData.subDistrict || '',
                clientType: isStandardType ? clientType : 'others',
                otherClientType: isStandardType ? '' : customerData.clientType || '',
            });

            setIsOtherClientType(!isStandardType);
        }
    }, [customerData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClientTypeChange = (value: string) => {
        const lowercaseValue = value.toLowerCase();
        setIsOtherClientType(lowercaseValue === 'others');
        setFormData((prev) => ({
            ...prev,
            clientType: lowercaseValue,
            otherClientType: lowercaseValue === 'others' ? prev.otherClientType : '',
        }));
    };

    const handleSubmit = () => {
        const updatedFormData = { ...formData };
        if (isOtherClientType) {
            updatedFormData.clientType = formData.otherClientType || 'Others';
        }
        onSubmit(updatedFormData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                        <TabsTrigger value="address-info">Address Info</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic-info">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="storeName">Store Name</Label>
                                    <Input
                                        id="storeName"
                                        name="storeName"
                                        value={formData.storeName}
                                        disabled
                                        className={nonEditableFieldStyle}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gstNumber">GST Number</Label>
                                    <Input
                                        id="gstNumber"
                                        name="gstNumber"
                                        value={formData.gstNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientFirstName">First Name</Label>
                                    <Input
                                        id="clientFirstName"
                                        name="clientFirstName"
                                        value={formData.clientFirstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientLastName">Last Name</Label>
                                    <Input
                                        id="clientLastName"
                                        name="clientLastName"
                                        value={formData.clientLastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="primaryContact">Phone</Label>
                                    <Input
                                        id="primaryContact"
                                        name="primaryContact"
                                        value={formData.primaryContact}
                                        disabled
                                        className={nonEditableFieldStyle}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientType">Client Type</Label>
                                <Select
                                    onValueChange={handleClientTypeChange}
                                    value={formData.clientType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Client Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shop">Shop</SelectItem>
                                        <SelectItem value="site visit">Site Visit</SelectItem>
                                        <SelectItem value="architect">Architect</SelectItem>
                                        <SelectItem value="engineer">Engineer</SelectItem>
                                        <SelectItem value="others">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {isOtherClientType && (
                                <div className="space-y-2">
                                    <Label htmlFor="otherClientType">Please specify</Label>
                                    <Input
                                        id="otherClientType"
                                        name="otherClientType"
                                        value={formData.otherClientType}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )}
                            <Button
                                className="w-full"
                                onClick={() => setActiveTab("address-info")}
                            >
                                Next
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="address-info">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="addressLine1">Address Line 1</Label>
                                <Input
                                    id="addressLine1"
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="addressLine2">Address Line 2</Label>
                                <Input
                                    id="addressLine2"
                                    name="addressLine2"
                                    value={formData.addressLine2}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="village">Village (District)</Label>
                                    <Input
                                        id="village"
                                        name="village"
                                        value={formData.village}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taluka">Taluka (Sub District)</Label>
                                    <Input
                                        id="taluka"
                                        name="taluka"
                                        value={formData.taluka}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveTab("basic-info")}
                                >
                                    Back
                                </Button>
                                <Button onClick={handleSubmit}>Update Customer</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default EditCustomerModal;