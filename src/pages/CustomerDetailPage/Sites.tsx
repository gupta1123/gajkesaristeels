import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, Modal, Input, Select, message, Form, DatePicker, Tooltip } from 'antd';
import { MapPin, Calendar, ArrowRight, ArrowLeft, CheckCircle2, X, Edit2, Trash2, PlusCircle, HardHat, Ruler, Building2, Phone, AlertTriangle, Edit3, User, Save, Users } from 'lucide-react';
import dayjs from 'dayjs';

import './Sites.css';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SitesProps {
    storeId: string;
    token: string;
}

interface Site {
    id: number;
    siteName: string;
    status: string;
    startDate: string;
    endDate: string;
    requirement: number;
    completed?: number;
    city: string;
    state: string | null;
    storeId: number;
    storeName: string;
    createdAt: string;
    createdTime: string;
    updatedAt: string;
    updatedTime: string;
    completionStatus: boolean;
    brandsInUse: string[];
}

interface Professional {
    name: string;
    role: string;
    contactInfo: string;
}

interface CompletionModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    site: Site | null;
    isMarkingComplete: boolean;
}

const CompletionStatusModal: React.FC<CompletionModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    site,
    isMarkingComplete
}) => {
    if (!site) return null;

    const completedPercentage = site.completed 
        ? Math.min(((site.completed / site.requirement) * 100), 100).toFixed(0)
        : 0;

    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            footer={null}
            width={400}
            className="completion-status-modal"
            closable={false}
        >
            <div className="completion-modal-content">
                <div className={`status-icon ${isMarkingComplete ? 'complete' : 'ongoing'}`}>
                    {isMarkingComplete ? (
                        <CheckCircle2 size={24} />
                    ) : (
                        <AlertTriangle size={24} />
                    )}
                </div>
                <h3 className="modal-title">
                    {isMarkingComplete ? 'Mark Site as Complete' : 'Mark Site as Ongoing'}
                </h3>
                
                <div className="site-summary">
                    <h4>Site Summary</h4>
                    <div className="summary-item">
                        <span>Site Name:</span>
                        <strong>{site.siteName}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Progress:</span>
                        <strong>{completedPercentage}% Complete</strong>
                    </div>
                    <div className="summary-item">
                        <span>Area Completed:</span>
                        <strong>{site.completed || 0} / {site.requirement} sq.ft</strong>
                    </div>
                </div>

                <p className="status-message">
                    {isMarkingComplete ? (
                        <>
                            Are you sure you want to mark this site as <span className="highlight complete">completed</span>? 
                            This will indicate that all work has been finished.
                        </>
                    ) : (
                        <>
                            Are you sure you want to mark this site as <span className="highlight ongoing">ongoing</span>? 
                            This will indicate that work is still in progress.
                        </>
                    )}
                </p>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className={`confirm-btn ${isMarkingComplete ? 'complete' : 'ongoing'}`}
                        onClick={onConfirm}
                    >
                        {isMarkingComplete ? 'Mark as Complete' : 'Mark as Ongoing'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const SiteModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    form: any;
    onFinish: (values: any) => void;
    isEditMode: boolean;
    currentSite: Site | null;
}> = ({ visible, onCancel, form, onFinish, isEditMode, currentSite }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isEditMode && currentSite) {
            form.setFieldsValue({
                siteName: currentSite.siteName,
                status: currentSite.status.toLowerCase(),
                dateRange: [dayjs(currentSite.startDate), dayjs(currentSite.endDate)],
                brands: currentSite.brandsInUse.join(', '),
                totalArea: currentSite.requirement,
                completedArea: currentSite.completed || 0,
                city: currentSite.city,
            });
        }
    }, [isEditMode, currentSite, form]);

    const handleNext = async () => {
        try {
            if (step === 1) {
                const values = await form.validateFields(['siteName', 'status', 'dateRange', 'brands']);
                setFormData({ ...formData, ...values });
                setStep(2);
            } else {
                const values = await form.validateFields(['totalArea', 'completedArea', 'city']);
                const allValues = { ...formData, ...values };
                onFinish(allValues);
            }
        } catch (errorInfo) {
            console.log('Validation failed:', errorInfo);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setStep(1);
        setFormData({});
        onCancel();
    };

    return (
        <Modal
            title={null}
            visible={visible}
            onCancel={handleCancel}
            footer={null}
            className="site-modal"
            width={420}
            closeIcon={<X className="modal-close-icon" />}
        >
            <div className="modal-header">
                <h3 className="modal-title">{isEditMode ? 'Edit Site' : 'Add New Site'}</h3>
                <p className="modal-subtitle">
                    {step === 1 ? 'Enter basic site information' : 'Provide site details and requirements'}
                </p>
            </div>

            <div className="modal-stepper">
                <div className={`stepper-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-number">
                        {step > 1 ? <CheckCircle2 size={20} /> : '1'}
                    </div>
                    <span>Basic Info</span>
                </div>
                <div className="stepper-line" />
                <div className={`stepper-item ${step === 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Site Details</span>
                </div>
            </div>

            <Form form={form} layout="vertical" className="site-form">
                <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                    <div className="form-section">
                        <Form.Item
                            name="siteName"
                            label="Site Name"
                            rules={[{ required: true, message: 'Site name is required' }]}
                        >
                            <Input placeholder="Enter site name" />
                        </Form.Item>

                        <div className="form-row">
                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Status is required' }]}
                            >
                                <Select>
                                    <Option value="active">
                                        <div className="status-option">
                                            <span className="status-dot active"></span>
                                            Active
                                        </div>
                                    </Option>
                                    <Option value="inactive">
                                        <div className="status-option">
                                            <span className="status-dot inactive"></span>
                                            Inactive
                                        </div>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="brands"
                                label="Brands"
                                tooltip={isEditMode ? "Brands cannot be edited" : "Enter brand names separated by commas"}
                            >
                                <Input 
                                    placeholder="e.g. Brand1, Brand2" 
                                    disabled={isEditMode}
                                    className={isEditMode ? 'disabled-input' : ''}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="dateRange"
                            label="Project Timeline"
                            rules={[{ required: true, message: 'Timeline is required' }]}
                        >
                            <RangePicker 
                                style={{ width: '100%' }} 
                                format="DD MMM YYYY"
                                separator={<ArrowRight size={16} />}
                            />
                        </Form.Item>
                    </div>
                </div>

                <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                    <div className="form-section">
                        <div className="section-group">
                            <h4 className="section-subtitle">Site Details</h4>
                            <div className="form-grid">
                            <Form.Item
    name="addressLine1"
    label="Address Line 1"
    rules={[{ required: true, message: 'Address is required' }]}
>
    <Input.TextArea
        placeholder="Enter street address"
        autoSize={{ minRows: 2, maxRows: 3 }}
        className="address-input"
        // Remove the prefix prop as TextArea doesn't support it
    />
</Form.Item>

                                <div className="form-row">
                                    <Form.Item
                                        name="addressLine2"
                                        label="Address Line 2 (Optional)"
                                    >
                                        <Input placeholder="Landmark, nearby location" />
                                    </Form.Item>
                                    
                                    <Form.Item
                                        name="city"
                                        label="City"
                                        rules={[{ required: true, message: 'City is required' }]}
                                    >
                                        <Input placeholder="Enter city name" />
                                    </Form.Item>
                                </div>

                                <div className="form-row measurements">
                                    <Form.Item
                                        name="totalArea"
                                        label="Total Area"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input 
                                            type="number"
                                            suffix="sq.ft"
                                            placeholder="Total"
                                            prefix={<div className="area-icon total" />}
                                        />
                                    </Form.Item>
                                    
                                    <Form.Item
                                        name="completedArea"
                                        label="Completed"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input 
                                            type="number"
                                            suffix="sq.ft"
                                            placeholder="Completed"
                                            prefix={<div className="area-icon completed" />}
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>

            <div className="modal-footer">
                <div className="step-buttons">
                    {step > 1 && (
                        <Button className="back-button" onClick={() => setStep(step - 1)}>
                            <ArrowLeft size={18} />
                            Back
                        </Button>
                    )}
                    <Button className="next-button" onClick={handleNext}>
                        {isEditMode ? 'Update Site' : 'Create Site'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const ViewAllProfessionalsModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    professionals: Array<{
        id: number;
        name: string;
        contact: string;
        role: string;
    }>;
    setSelectedProfessional: (professional: any) => void;
    setIsDeleteModalVisible: (visible: boolean) => void;
}> = ({ visible, onCancel, professionals, setSelectedProfessional, setIsDeleteModalVisible }) => {
    const [showPagination, setShowPagination] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Calculate items to display
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = showPagination 
        ? professionals.slice(indexOfFirstItem, indexOfLastItem)
        : professionals.slice(0, 6);
    const totalPages = Math.ceil(professionals.length / itemsPerPage);

    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            className="view-professionals-modal"
            title={null}
            closable={false}
        >
            <div className="view-modal-header">
                <h3 className="modal-title">All Site Professionals</h3>
                <button className="modal-close" onClick={onCancel}>
                    <X size={20} />
                </button>
            </div>
            
            <div className="view-modal-content">
                <div className="all-professionals-grid">
                    {currentItems.map((professional) => (
                        <div key={professional.id} className="professional-card">
                            <div className="professional-info">
                                <div className="role-icon">
                                    {professional.role === 'engineer' && <HardHat size={16} />}
                                    {professional.role === 'architect' && <Ruler size={16} />}
                                    {professional.role === 'builder' && <Building2 size={16} />}
                                </div>
                                <div className="professional-details">
                                    <span className="professional-name">{professional.name}</span>
                                    <span className="professional-role">{professional.role}</span>
                                    <span className="professional-contact">
                                        <Phone size={14} />
                                        {professional.contact}
                                    </span>
                                </div>
                            </div>
                            <div className="professional-actions">
                            <button 
    className="remove-professional"
    onClick={(e) => {
        e.stopPropagation();
        setSelectedProfessional(professional);
        setIsDeleteModalVisible(true);
    }}
>
    <X size={16} />
</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    {professionals.length > 6 && !showPagination && (
                        <button 
                            className="show-more-btn"
                            onClick={() => setShowPagination(true)}
                        >
                            Show More
                        </button>
                    )}

                    {showPagination && (
                        <>
                            <Pagination className="pagination-container">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className={currentPage === 1 ? 'disabled' : ''}
                                        />
                                    </PaginationItem>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(i + 1)}
                                                isActive={currentPage === i + 1}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    
                                    <PaginationItem>
                                        <PaginationNext 
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className={currentPage === totalPages ? 'disabled' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                            <button 
                                className="show-less-btn"
                                onClick={() => {
                                    setShowPagination(false);
                                    setCurrentPage(1);
                                }}
                            >
                                Show Less
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const Sites: React.FC<SitesProps> = ({ storeId, token }) => {
    const [sites, setSites] = useState<Site[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSite, setCurrentSite] = useState<Site | null>(null);
    const [form] = Form.useForm();
    const [showMore, setShowMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;
    const [professionals, setProfessionals] = useState<Array<{
        id: number;
        name: string;
        contact: string;
        role: string;
        storeId: number;
        storeName: string;
    }>>([]);
    const [isProfessionalModalVisible, setIsProfessionalModalVisible] = useState(false);
const [professionalForm] = Form.useForm();
    const [isViewAllModalVisible, setIsViewAllModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<{
        id: number;
        name: string;
        role: string;
        contact: string;
        storeId: number;
    } | null>(null);
    const [isRemoveBrandModalVisible, setIsRemoveBrandModalVisible] = useState(false);
    const [selectedBrandToRemove, setSelectedBrandToRemove] = useState<{site: Site; brand: string} | null>(null);
    const [isAddBrandModalVisible, setIsAddBrandModalVisible] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [brandInput, setBrandInput] = useState('');
    const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
    const [selectedSiteForCompletion, setSelectedSiteForCompletion] = useState<Site | null>(null);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);

    const roles = [
        { value: 'engineer', label: 'Engineer', icon: <HardHat size={18} /> },
        { value: 'architect', label: 'Architect', icon: <Ruler size={18} /> },
        { value: 'builder', label: 'Builder', icon: <Building2 size={18} /> },
    ];

    const fetchSites = useCallback(async () => {
        try {
            const response = await axios.get<Site[]>(`https://api.gajkesaristeels.in/site/getByStore?id=${storeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSites(response.data);
        } catch (error) {
            console.error('Error fetching sites:', error);
        }
    }, [storeId, token]);

    useEffect(() => {
        if (storeId) {
            fetchSites();
        }
    }, [storeId, fetchSites]);

    const onFinish = async (values: any) => {
        try {
            const brands = values.brands.split(',').map((brand: string) => brand.trim()).filter(Boolean);
            
            const sitePayload = {
                siteName: values.siteName,
                startDate: dayjs(values.dateRange[0]).format('YYYY-MM-DD'),
                endDate: dayjs(values.dateRange[1]).format('YYYY-MM-DD'),
                status: values.status,
                requirement: parseFloat(values.totalArea),
                city: values.city,
                storeId: parseInt(storeId, 10),
                completed: parseFloat(values.completedArea),
                brandsInUse: brands
            };

            if (isEditMode && currentSite) {
                await axios.put(`https://api.gajkesaristeels.in/site/update?id=${currentSite.id}`, sitePayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                message.success('Site updated successfully');
            } else {
                const siteResponse = await axios.post('https://api.gajkesaristeels.in/site/add', sitePayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (siteResponse.status === 200) {
                    message.success('Site added successfully');
                }
            }

            setIsModalVisible(false);
            form.resetFields();
            fetchSites();
        } catch (error) {
            console.error('Error saving site:', error);
            message.error('Failed to save site');
        }
    };

    const handleEdit = (site: Site) => {
        setIsEditMode(true);
        setCurrentSite(site);
        setIsModalVisible(true);
    };
    useEffect(() => {
        if (isEditModalVisible && selectedProfessional) {
            professionalForm.setFieldsValue({
                name: selectedProfessional.name,
                role: selectedProfessional.role,
                contactInfo: selectedProfessional.contact
            });
        }
    }, [isEditModalVisible, selectedProfessional, professionalForm]);
    const handleDelete = async (siteId: number) => {
        try {
            await axios.delete(`https://api.gajkesaristeels.in/site/delete?id=${siteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            message.success('Site deleted successfully');
            fetchSites();
        } catch (error) {
            console.error('Error deleting site:', error);
            message.error('Failed to delete site');
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = showMore 
        ? sites.slice(indexOfFirstItem, indexOfLastItem)
        : sites.slice(0, 2);
    const totalPages = Math.ceil(sites.length / itemsPerPage);

    const fetchProfessionals = useCallback(async () => {
        try {
            const response = await axios.get(
                `https://api.gajkesaristeels.in/professionals/getByStore?storeId=${storeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setProfessionals(response.data);
        } catch (error) {
            console.error('Error fetching professionals:', error);
            message.error('Failed to fetch professionals');
        }
    }, [storeId, token]);

    useEffect(() => {
        if (storeId) {
            fetchProfessionals();
        }
    }, [storeId, fetchProfessionals]);


    const handleAddProfessional = async (values: any) => {
        try {
            const payload = {
                name: values.name,
                role: values.role,
                contact: parseInt(values.contactInfo),
                storeId: parseInt(storeId)
            };
    
            const response = await axios.post(
                'https://api.gajkesaristeels.in/professionals/addForStore',
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
    
            if (response.data) {
                message.success('Professional added successfully');
                setIsProfessionalModalVisible(false);
                professionalForm.resetFields();
                fetchProfessionals();
            }
        } catch (error) {
            console.error('Error adding professional:', error);
            message.error('Failed to add professional');
        }
    };
// Add this function near your other handler functions
const handleEditProfessional = async (values: any) => {
    if (!selectedProfessional) return;
    
    try {
        const payload = {
            name: values.name,
            role: values.role,
            contact: parseInt(values.contactInfo),
            storeId: parseInt(storeId)
        };

        const response = await axios.put(
            `https://api.gajkesaristeels.in/professionals/edit?professionalId=${selectedProfessional.id}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data) {
            message.success('Professional updated successfully');
            setIsEditModalVisible(false);
            professionalForm.resetFields();
            fetchProfessionals();
            setSelectedProfessional(null);
        }
    } catch (error) {
        console.error('Error updating professional:', error);
        message.error('Failed to update professional');
    }
};
    const handleDeleteProfessional = async () => {
        if (!selectedProfessional) return; 
        try {
            const response = await axios.delete(
                `https://api.gajkesaristeels.in/professionals/delete?professionalId=${selectedProfessional.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data) {
                message.success('Professional deleted successfully');
                setIsDeleteModalVisible(false);
                fetchProfessionals();
            }
        } catch (error) {
            console.error('Error deleting professional:', error);
            message.error('Failed to delete professional');
        }
    };

    const handleRemoveBrand = async () => {
        if (!selectedBrandToRemove) return;
        
        try {
            const response = await axios.put(
                `https://api.gajkesaristeels.in/site/removeBrands?id=${selectedBrandToRemove.site.id}`,
                {
                    brands: [selectedBrandToRemove.brand]
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data === 'Brands removed!') {
                message.success('Brand removed successfully');
                setIsRemoveBrandModalVisible(false);
                setSelectedBrandToRemove(null);
                fetchSites();
            }
        } catch (error) {
            console.error('Error removing brand:', error);
            message.error('Failed to remove brand');
        }
    };

    const handleAddBrand = async () => {
        if (!selectedSite || !brandInput) return;
        
        try {
            const newBrands = brandInput.split(',').map(brand => brand.trim()).filter(Boolean);
            
            const combinedBrands = [...selectedSite.brandsInUse, ...newBrands];
            
            const uniqueBrands = Array.from(new Set(combinedBrands));
            
            const response = await axios.put(
                `https://api.gajkesaristeels.in/site/addBrands?id=${selectedSite.id}`,
                {
                    brands: uniqueBrands
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data === 'Brands updated!') {
                message.success('Brands added successfully');
                setIsAddBrandModalVisible(false);
                setBrandInput('');
                setSelectedSite(null);
                fetchSites();
            }
        } catch (error) {
            console.error('Error adding brands:', error);
            message.error('Failed to add brands');
        }
    };

    const handleToggleCompletion = async (site: Site) => {
        setSelectedSiteForCompletion(site);
        setIsMarkingComplete(!site.completionStatus);
        setIsCompletionModalVisible(true);
    };

    const confirmStatusChange = async () => {
        if (!selectedSiteForCompletion) return;

        try {
            const response = await axios.put(
                `https://api.gajkesaristeels.in/site/markCompletionStatus?id=${selectedSiteForCompletion.id}&status=${isMarkingComplete}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.data === 'Status Updated!') {
                message.success(`Site marked as ${isMarkingComplete ? 'completed' : 'ongoing'} successfully`);
                fetchSites();
            }
        } catch (error) {
            console.error('Error updating completion status:', error);
            message.error('Failed to update site status');
        } finally {
            setIsCompletionModalVisible(false);
            setSelectedSiteForCompletion(null);
        }
    };

    return (
        <div className="sites-container">
            <div className="site-professionals-container">
                <div className="section-header">
                    <h2 className="section-title">Site Professionals</h2>
                    <Button
    onClick={() => setIsProfessionalModalVisible(true)}
    className="add-professional-btn"
>
    <PlusCircle size={18} />
    Add Professional
</Button>

                </div>

                <div className="professionals-grid">
                    {professionals.slice(0, 3).map((professional) => (
                        <div key={professional.id} className="professional-card">
                            <div className="professional-info">
                                <div className="role-icon">
                                    {professional.role === 'engineer' && <HardHat size={16} />}
                                    {professional.role === 'architect' && <Ruler size={16} />}
                                    {professional.role === 'builder' && <Building2 size={16} />}
                                </div>
                                <div className="professional-details">
                                    <span className="professional-name">{professional.name}</span>
                                    <span className="professional-role">{professional.role}</span>
                                    <span className="professional-contact">
                                        <Phone size={14} />
                                        {professional.contact}
                                    </span>
                                </div>
                            </div>
                            <div className="professional-actions">
                                <Tooltip title="Edit Professional">
                                <button 
    className="action-btn edit"
    onClick={() => {
        setSelectedProfessional(professional);
        setIsEditModalVisible(true);
    }}
>
    <Edit2 size={16} />
</button>
                                </Tooltip>
                                <Tooltip title="Delete Professional">
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => {
                                            setSelectedProfessional(professional);
                                            setIsDeleteModalVisible(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                    {professionals.length === 0 && (
                        <div className="empty-state">
                            <span className="empty-text">No professionals assigned</span>
                        </div>
                    )}
                </div>
                
                {professionals.length > 3 && (
                    <div className="view-all-wrapper">
                        <button 
                            className="view-all-professionals-btn"
                            onClick={() => setIsViewAllModalVisible(true)}
                        >
                            <Users size={16} />
                            View All ({professionals.length})
                        </button>
                    </div>
                )}

                <ViewAllProfessionalsModal
                    visible={isViewAllModalVisible}
                    onCancel={() => setIsViewAllModalVisible(false)}
                    professionals={professionals}
                    setSelectedProfessional={setSelectedProfessional}
                    setIsDeleteModalVisible={setIsDeleteModalVisible}
                />

                <Modal
                    visible={isDeleteModalVisible}
                    onCancel={() => {
                        setIsDeleteModalVisible(false);
                        setSelectedProfessional(null);
                    }}
                    footer={null}
                    width={400}
                    className="delete-professional-modal"
                    closable={false}
                >
                    <div className="delete-modal-content">
                        <div className="delete-icon-wrapper">
                            <AlertTriangle size={28} className="delete-icon" />
                        </div>
                        <h3 className="delete-title">Remove Professional</h3>
                        <p className="delete-message">
                            Are you sure you want to remove <span className="highlight">{selectedProfessional?.name}</span> from your site professionals? This action cannot be undone.
                        </p>
                        <div className="delete-actions">
                            <button 
                                className="cancel-delete-btn"
                                onClick={() => {
                                    setIsDeleteModalVisible(false);
                                    setSelectedProfessional(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-delete-btn"
                                onClick={handleDeleteProfessional}
                            >
                                Remove Professional
                            </button>
                        </div>
                    </div>
                </Modal>
                <Modal
                    visible={isProfessionalModalVisible}
                    onCancel={() => {
                        setIsProfessionalModalVisible(false);
                        professionalForm.resetFields();
                    }}
                    footer={null}
                    width={420}
                    className="professional-modal"
                    closable={false}
                >
                    <div className="professional-modal-header">
                        <div className="modal-title-section">
                            <div className="title-icon">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="modal-title">Add Professional</h3>
                                <p className="modal-subtitle">Enter professional details</p>
                            </div>
                        </div>
                        <button 
                            className="modal-close-btn"
                            onClick={() => {
                                setIsProfessionalModalVisible(false);
                                professionalForm.resetFields();
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <Form
                        form={professionalForm}
                        layout="vertical"
                        className="professional-form"
                        onFinish={handleAddProfessional}
                    >
                        <div className="input-group">
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter the name' }]}
                            >
                                <Input 
                                    prefix={<User size={16} className="input-icon" />}
                                    placeholder="Enter professional's name"
                                />
                            </Form.Item>

                            <Form.Item
                                name="role"
                                label="Role"
                                rules={[{ required: true, message: 'Please select a role' }]}
                            >
                                <Select placeholder="Select role">
                                    {roles.map(role => (
                                        <Option key={role.value} value={role.value}>
                                            <div className="role-option">
                                                {role.icon}
                                                <span>{role.label}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="contactInfo"
                                label="Contact Information"
                                rules={[
                                    { required: true, message: 'Please enter contact information' },
                                    {
                                        pattern: /^[0-9]{10}$/,
                                        message: 'Please enter a valid 10-digit phone number'
                                    }
                                ]}
                            >
                                <Input 
                                    prefix={<Phone size={16} className="input-icon" />}
                                    placeholder="Enter 10-digit phone number"
                                />
                            </Form.Item>
                        </div>
                    </Form>

                    <div className="professional-modal-footer">
                        <button
                            className="cancel-btn"
                            onClick={() => {
                                setIsProfessionalModalVisible(false);
                                professionalForm.resetFields();
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="submit-btn"
                            onClick={() => professionalForm.submit()}
                        >
                            <Save size={16} />
                            Add Professional
                        </button>
                    </div>
                </Modal>
                <Modal
                    visible={isDeleteModalVisible}
                    onCancel={() => setIsDeleteModalVisible(false)}
                    footer={null}
                    width={400}
                    className="delete-confirmation-modal"
                    closable={false}
                >
                    <div className="delete-modal-content">
                        <div className="delete-icon-wrapper">
                            <AlertTriangle size={32} className="delete-icon" />
                        </div>
                        <h3 className="delete-title">Delete Professional</h3>
                        <p className="delete-message">
                            Are you sure you want to delete{' '}
                            <span className="highlight">{selectedProfessional?.name}</span>?
                            This action cannot be undone.
                        </p>
                        <div className="delete-actions">
                            <button 
                                className="cancel-btn"
                                onClick={() => setIsDeleteModalVisible(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="delete-btn"
                                onClick={handleDeleteProfessional}
                            >
                                Delete Professional
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>

            <Button
                onClick={() => {
                    setIsEditMode(false);
                    setCurrentSite(null);
                    setIsModalVisible(true);
                }}
                className="add-site-btn"
            >
                <PlusCircle size={18} />
                Add New Site
            </Button>

            <div className="sites-grid">
                {currentItems.map((site) => (
                    <div key={site.id} className="site-card">
                        <div className="site-card-left">
                            <div className="site-header">
                                <div className="site-title-row">
                                    <h3 className="site-title">{site.siteName}</h3>
                                    <div className="site-actions">
                                        <Tooltip title="Edit Site">
                                            <button className="icon-button edit" onClick={() => handleEdit(site)}>
                                                <Edit2 size={16} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip title="Delete Site">
                                            <button className="icon-button delete" onClick={() => handleDelete(site.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                                <span className={`status-badge ${site.status?.toLowerCase() || 'unknown'}`}>
                                    {site.status || 'Unknown'}
                                </span>
                                <div className="site-location">
                                    <MapPin size={16} />
                                    <span>{site.city}</span>
                                </div>
                                
                                <div className="site-brands-container">
                                    <div className="brands-header">
                                        <span className="brands-title">Brands</span>
                                        <button 
                                            className="brand-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSite(site);
                                                setIsAddBrandModalVisible(true);
                                            }}
                                        >
                                            <PlusCircle size={16} />
                                        </button>
                                    </div>
                                    <div className="site-brands">
                                        {site.brandsInUse.map((brand) => (
                                            <div key={brand} className="brand-pill">
                                                {brand}
                                                <button 
                                                    className="remove-brand"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBrandToRemove({ site, brand: brand });
                                                        setIsRemoveBrandModalVisible(true);
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="site-dates">
                                <div className="date-row">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="date-label">Start</span>
                                    <span className="date-value">{dayjs(site.startDate).format('DD MMM YYYY')}</span>
                                </div>
                                <div className="date-row">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="date-label">End</span>
                                    <span className="date-value">{dayjs(site.endDate).format('DD MMM YYYY')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="site-card-right">
                            <div className="progress-section">
                                <div className="progress-metrics">
                                    <div className="progress-header">
                                        <span className="progress-title">Project Progress</span>
                                        <Tooltip title={site.completionStatus ? 'Mark as Ongoing' : 'Mark as Completed'}>
                                            <button
                                                className={`status-toggle ${site.completionStatus ? 'completed' : 'ongoing'}`}
                                                onClick={() => handleToggleCompletion(site)}
                                            >
                                                {site.completionStatus ? (
                                                    <>
                                                        <CheckCircle2 size={14} />
                                                        Completed
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertTriangle size={14} />
                                                        Ongoing
                                                    </>
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                    
                                    <div className="progress-bar-container">
                                        <div
                                            className={`progress-bar ${site.completionStatus ? 'completed' : ''}`}
                                            style={{ 
                                                width: `${site.completed ? Math.min(((site.completed / site.requirement) * 100), 100) : 0}%` 
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="progress-stats">
                                    <div className="stat-item">
                                        <div className="stat-value">{site.completed || 0}</div>
                                        <div className="stat-label">Completed (sq.ft)</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{site.requirement}</div>
                                        <div className="stat-label">Total Area (sq.ft)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sites-footer">
                {showMore && sites.length > itemsPerPage && (
                    <Pagination className="pagination-container">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className={currentPage === 1 ? 'disabled' : ''}
                                />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={currentPage === page}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                                <PaginationNext 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className={currentPage === totalPages ? 'disabled' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}

                {sites.length > 2 && (
                    <Button
                        onClick={() => {
                            setShowMore(!showMore);
                            setCurrentPage(1); // Reset to first page when toggling
                        }}
                        className="show-more-btn"
                    >
                        {showMore ? 'Show Less' : 'Show More'}
                    </Button>
                )}
            </div>

            <SiteModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                form={form}
                onFinish={onFinish}
                isEditMode={isEditMode}
                currentSite={currentSite}
            />


<Modal
    visible={isEditModalVisible}
    onCancel={() => {
        setIsEditModalVisible(false);
        professionalForm.resetFields();
        setSelectedProfessional(null);
    }}
    footer={null}
    width={420}
    className="professional-modal"
    closable={false}
>
    <div className="professional-modal-header">
        <div className="modal-title-section">
            <div className="title-icon">
                <Edit3 size={20} />
            </div>
            <div>
                <h3 className="modal-title">Edit Professional</h3>
                <p className="modal-subtitle">Update professional details</p>
            </div>
        </div>
        <button 
            className="modal-close-btn"
            onClick={() => {
                setIsEditModalVisible(false);
                professionalForm.resetFields();
                setSelectedProfessional(null);
            }}
        >
            <X size={20} />
        </button>
    </div>

    <Form
        form={professionalForm}
        layout="vertical"
        className="professional-form"
        onFinish={handleEditProfessional}
    >
        <div className="input-group">
            <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter the name' }]}
            >
                <Input 
                    prefix={<User size={16} className="input-icon" />}
                    placeholder="Enter professional's name"
                />
            </Form.Item>

            <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
            >
                <Select placeholder="Select role">
                    {roles.map(role => (
                        <Option key={role.value} value={role.value}>
                            <div className="role-option">
                                {role.icon}
                                <span>{role.label}</span>
                            </div>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="contactInfo"
                label="Contact Information"
                rules={[
                    { required: true, message: 'Please enter contact information' },
                    {
                        pattern: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                    }
                ]}
            >
                <Input 
                    prefix={<Phone size={16} className="input-icon" />}
                    placeholder="Enter 10-digit phone number"
                />
            </Form.Item>
        </div>
    </Form>

    <div className="professional-modal-footer">
        <button
            className="cancel-btn"
            onClick={() => {
                setIsEditModalVisible(false);
                professionalForm.resetFields();
                setSelectedProfessional(null);
            }}
        >
            Cancel
        </button>
        <button
            className="submit-btn"
            onClick={() => professionalForm.submit()}
        >
            <Save size={16} />
            Save Changes
        </button>
    </div>
</Modal>
<Modal
    visible={isRemoveBrandModalVisible}
    onCancel={() => {
        setIsRemoveBrandModalVisible(false);
        setSelectedBrandToRemove(null);
    }}
    footer={null}
    width={400}
    className="remove-brand-modal"
    closable={false}
>
    <div className="remove-modal-content">
        <div className="remove-icon-wrapper">
            <AlertTriangle size={28} className="remove-icon" />
        </div>
        <h3 className="remove-title">Remove Brand</h3>
        <p className="remove-message">
            Are you sure you want to remove <span className="highlight">{selectedBrandToRemove?.brand}</span> from this site? This action cannot be undone.
        </p>
        <div className="remove-actions">
            <button 
                className="cancel-remove-btn"
                onClick={() => {
                    setIsRemoveBrandModalVisible(false);
                    setSelectedBrandToRemove(null);
                }}
            >
                Cancel
            </button>
            <button 
                className="confirm-remove-btn"
                onClick={handleRemoveBrand}
            >
                Remove Brand
            </button>
        </div>
    </div>
</Modal>

<Modal
    visible={isAddBrandModalVisible}
    onCancel={() => {
        setIsAddBrandModalVisible(false);
        setBrandInput('');
        setSelectedSite(null);
    }}
    footer={null}
    width={400}
    className="add-brand-modal"
    closable={false}
>
    <div className="add-brand-content">
        <div className="add-icon-wrapper">
            <PlusCircle size={28} className="add-icon" />
        </div>
        <h3 className="add-title">Add Brands</h3>
        <p className="add-message">
            Enter brand names separated by commas to add them to <span className="highlight">{selectedSite?.siteName}</span>
        </p>
        <div className="brand-input-container">
            <Input.TextArea
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="e.g. Brand1, Brand2, Brand3"
                autoSize={{ minRows: 2, maxRows: 4 }}
                className="brand-input"
            />
        </div>
        <div className="add-actions">
            <button 
                className="cancel-add-btn"
                onClick={() => {
                    setIsAddBrandModalVisible(false);
                    setBrandInput('');
                    setSelectedSite(null);
                }}
            >
                Cancel
            </button>
            <button 
                className="confirm-add-btn"
                onClick={handleAddBrand}
                disabled={!brandInput.trim()}
            >
                Add Brands
            </button>
        </div>
    </div>
</Modal>
<CompletionStatusModal
    visible={isCompletionModalVisible}
    onCancel={() => {
        setIsCompletionModalVisible(false);
        setSelectedSiteForCompletion(null);
    }}
    onConfirm={confirmStatusChange}
    site={selectedSiteForCompletion}
    isMarkingComplete={isMarkingComplete}
/>
        </div>
    );
};

export default Sites;