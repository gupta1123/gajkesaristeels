import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import styles from './WorkingDays.module.css';

const WorkingDays: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const [workingDays, setWorkingDays] = useState({ fullDayCount: 6, halfDayCount: 3 });
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({ fullDayCount: 6, halfDayCount: 3 });

    const fetchWorkingDays = useCallback(async () => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/attendance-rule/getById?id=2`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const result = await response.json();
            setWorkingDays(result);
            setEditedData(result);
        } catch (error) {
            console.error('Error fetching working days:', error);
        }
    }, [authToken]);

    const updateWorkingDays = async () => {
        try {
            await fetch(`https://api.gajkesaristeels.in/attendance-rule/edit?id=2`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedData),
            });
            fetchWorkingDays();
            setEditMode(false);
        } catch (error) {
            console.error('Error updating working days:', error);
        }
    };

    useEffect(() => {
        fetchWorkingDays();
    }, [fetchWorkingDays]);

    return (
        <div className={styles.workingDaysContainer}>
            <h2>Working Days</h2>
            <Table className={styles.table}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Full Days</TableHead>
                        <TableHead>Half Days</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            {editMode ? (
                                <input
                                    type="number"
                                    value={editedData.fullDayCount}
                                    onChange={(e) => setEditedData({ ...editedData, fullDayCount: parseInt(e.target.value, 10) })}
                                />
                            ) : (
                                workingDays.fullDayCount
                            )}
                        </TableCell>
                        <TableCell>
                            {editMode ? (
                                <input
                                    type="number"
                                    value={editedData.halfDayCount}
                                    onChange={(e) => setEditedData({ ...editedData, halfDayCount: parseInt(e.target.value, 10) })}
                                />
                            ) : (
                                workingDays.halfDayCount
                            )}
                        </TableCell>
                        <TableCell>
                            {editMode ? (
                                <Button variant="outline" size="sm" onClick={() => {
                                    updateWorkingDays();
                                    setEditMode(false);
                                }}>Save</Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button>
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};

export default WorkingDays;