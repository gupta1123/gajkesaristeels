import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/router';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface CustomerData {
  id?: number;
  storeName?: string;
  clientFirstName?: string;
  clientLastName?: string;
  primaryContact?: string | number;
  secondaryContact?: string | number;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string | number;
  gstNumber?: string;
  monthlySale?: string | number;
  clientType?: string;
  fieldOfficerId?: number;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  employeeId: number | null;
  existingData?: CustomerData;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  token,
  existingData,
}) => {
  const [customerData, setCustomerData] = useState<CustomerData>(
    existingData || {
      clientFirstName: '',
      clientLastName: '',
      email: '',
    }
  );
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('https://api.gajkesaristeels.in/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: Employee[] = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, [token]);

  const handleInputChange = (field: keyof CustomerData, value: string | number) => {
    let parsedValue: string | number = value;
    const numberFields: (keyof CustomerData)[] = ['pincode', 'monthlySale', 'primaryContact', 'secondaryContact', 'fieldOfficerId'];
    if (numberFields.includes(field)) {
      parsedValue = value === '' ? '' : parseInt(value.toString(), 10);
    }

    setCustomerData((prevData) => ({
      ...prevData,
      [field]: parsedValue,
    }));
  };

  const handleSubmit = async () => {
    try {
      const requestBody = {
        ...customerData,
        primaryContact: customerData.primaryContact ? parseInt(customerData.primaryContact.toString(), 10) : undefined,
        secondaryContact: customerData.secondaryContact ? parseInt(customerData.secondaryContact.toString(), 10) : undefined,
        pincode: customerData.pincode ? parseInt(customerData.pincode.toString(), 10) : undefined,
        monthlySale: customerData.monthlySale ? parseInt(customerData.monthlySale.toString(), 10) : undefined,
        latitude: 10.0,
        longitude: -23.0,
        employeeId: customerData.fieldOfficerId, // Use selected field officer's ID
      };

      console.log('requestBody', requestBody)
      const url = existingData && existingData.id
        ? `https://api.gajkesaristeels.in/store/update?id=${existingData.id}`
        : 'https://api.gajkesaristeels.in/store/create';
      const method = existingData && existingData.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(response)
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        router.push(`/CustomerDetailPage/${data}`);
        onClose(); // Close the modal after successful submission
      } else {
        console.error('Failed to update/create customer');
        // Handle error case, e.g., show an error message to the user
      }
    } catch (error) {
      console.error('Error updating/creating customer:', error);
      // Handle error case, e.g., show an error message to the user
    }
  };

  const handleNext = () => {
    if (activeTab === 'basic') {
      setActiveTab('contact');
    } else if (activeTab === 'contact') {
      setActiveTab('address');
    } else if (activeTab === 'address') {
      setActiveTab('additional');
    }
  };

  const handlePrevious = () => {
    if (activeTab === 'additional') {
      setActiveTab('address');
    } else if (activeTab === 'address') {
      setActiveTab('contact');
    } else if (activeTab === 'contact') {
      setActiveTab('basic');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Enter the details of the new customer.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="storeName" className="text-right">
                  Shop Name
                </Label>
                <Input id="storeName" value={customerData.storeName || ''} className="col-span-3" onChange={(e) => handleInputChange('storeName', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientFirstName" className="text-right">
                  First Name
                </Label>
                <Input id="clientFirstName" value={customerData.clientFirstName || ''} className="col-span-3" onChange={(e) => handleInputChange('clientFirstName', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientLastName" className="text-right">
                  Last Name
                </Label>
                <Input id="clientLastName" value={customerData.clientLastName || ''} className="col-span-3" onChange={(e) => handleInputChange('clientLastName', e.target.value)} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="contact" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="primaryContact" className="text-right">
                  Primary Contact
                </Label>
                <Input id="primaryContact" type="tel" value={customerData.primaryContact || ''} className="col-span-3" onChange={(e) => handleInputChange('primaryContact', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secondaryContact" className="text-right">
                  Secondary Contact
                </Label>
                <Input id="secondaryContact" type="tel" value={customerData.secondaryContact || ''} className="col-span-3" onChange={(e) => handleInputChange('secondaryContact', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" value={customerData.email || ''} className="col-span-3" onChange={(e) => handleInputChange('email', e.target.value)} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="address" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addressLine1" className="text-right">
                  Address Line 1
                </Label>
                <Input id="addressLine1" value={customerData.addressLine1 || ''} className="col-span-3" onChange={(e) => handleInputChange('addressLine1', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addressLine2" className="text-right">
                  Address Line 2
                </Label>
                <Input id="addressLine2" value={customerData.addressLine2 || ''} className="col-span-3" onChange={(e) => handleInputChange('addressLine2', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input id="city" value={customerData.city || ''} className="col-span-3" onChange={(e) => handleInputChange('city', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  State
                </Label>
                <Input id="state" value={customerData.state || ''} className="col-span-3" onChange={(e) => handleInputChange('state', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  Country
                </Label>
                <Input id="country" value={customerData.country || ''} className="col-span-3" onChange={(e) => handleInputChange('country', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pincode" className="text-right">
                  Pincode
                </Label>
                <Input id="pincode" type="number" value={customerData.pincode || ''} className="col-span-3" onChange={(e) => handleInputChange('pincode', e.target.value)} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="additional" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gstNumber" className="text-right">
                  GST Number
                </Label>
                <Input id="gstNumber" value={customerData.gstNumber || ''} className="col-span-3" onChange={(e) => handleInputChange('gstNumber', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthlySale" className="text-right">
                  Monthly Sale
                </Label>
                <Input id="monthlySale" type="number" value={customerData.monthlySale || ''} className="col-span-3" onChange={(e) => handleInputChange('monthlySale', e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientType" className="text-right">
                  Client Type
                </Label>
                <div className="col-span-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full">
                      <Input
                        id="clientType"
                        value={customerData.clientType || ''}
                        placeholder="Select Client Type"
                        readOnly
                        className="cursor-pointer text-gray-400"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleInputChange('clientType', 'Project')}>Project</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInputChange('clientType', 'Shop')}>Shop</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fieldOfficer" className="text-right">
                  Field Officer
                </Label>
                <div className="col-span-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full">
                      <Input
                        id="fieldOfficer"
                        value={customerData.fieldOfficerId ? employees.find((emp) => emp.id === customerData.fieldOfficerId)?.firstName : ''}
                        placeholder="Select Field Officer"
                        readOnly
                        className="cursor-pointer text-gray-400"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {employees.map((employee) => (
                        <DropdownMenuItem key={employee.id} onClick={() => handleInputChange('fieldOfficerId', employee.id.toString())}>
                          {employee.firstName} {employee.lastName}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab !== 'basic' && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {activeTab !== 'additional' ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Add Customer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerModal;