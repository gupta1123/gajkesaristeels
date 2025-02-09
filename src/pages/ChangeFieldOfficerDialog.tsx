import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
type FieldOfficer = {
  id: number;
  firstName: string;
  lastName: string;
};

type ChangeFieldOfficerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFieldOfficerId: string) => void;
};

const ChangeFieldOfficerDialog = ({ isOpen, onClose, onConfirm }: ChangeFieldOfficerDialogProps) => {
  const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>('');
  const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
  const token = useSelector((state: RootState) => state.auth.token);


  useEffect(() => {
    const fetchFieldOfficers = async () => {
      try {
        const response = await fetch('https://api.gajkesaristeels.in/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setFieldOfficers(data);
      } catch (error) {
        console.error('Error fetching field officers:', error);
      }
    };

    if (isOpen) {
      fetchFieldOfficers();
    }
  }, [isOpen, token]);

   

  const handleConfirm = () => {
    onConfirm(selectedFieldOfficer);
    onClose();
  };

  const handleClose = () => {
    setSelectedFieldOfficer('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Field Officer</DialogTitle>
          <DialogDescription>Select a field officer to assign to the selected customers.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Select value={selectedFieldOfficer} onValueChange={setSelectedFieldOfficer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a field officer" />
            </SelectTrigger>
            <SelectContent>
              {fieldOfficers.map((officer) => (
                <SelectItem key={officer.id} value={officer.id.toString()}>
                  {officer.firstName} {officer.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeFieldOfficerDialog;