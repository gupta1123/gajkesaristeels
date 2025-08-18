import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import './ApprovalPage.css';

interface ApprovalRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  requestDate: string;
  requestedStatus: string;
  logDate: string;
  actionDate: string | null;
  status: string;
}

export default function ApprovalPage() {
  const authToken = useSelector((state: RootState) => state.auth.token);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalType, setApprovalType] = useState<{ [key: number]: 'full day' | 'half day' | null }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');

  useEffect(() => {
    if (authToken) {
      fetchPendingRequests();
    }
  }, [authToken]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApprovalRequest[]>(
        'https://api.gajkesaristeels.in/request/getByStatus?status=pending',
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      setRequests(response.data);
    } catch (err) {
      setError('Failed to fetch pending requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: number, action: 'approved' | 'rejected') => {
    const type = approvalType[id] || requests.find(r => r.id === id)?.requestedStatus || 'full day';
    
    try {
      await axios.put(
        `https://api.gajkesaristeels.in/request/updateStatus?id=${id}&status=${action}&attendance=${encodeURIComponent(type)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            requestId: id.toString()
          }
        }
      );
      await fetchPendingRequests();
      setApprovalType(prev => ({ ...prev, [id]: null }));
    } catch (err) {
      setError('Failed to update request status. Please try again.');
    }
  };

  const handleTypeChange = (id: number, type: 'full day' | 'half day') => {
    setApprovalType(prev => ({ ...prev, [id]: type }));
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(request => {
      const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.employeeName.localeCompare(b.employeeName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      }
    });
  }, [requests, searchTerm, statusFilter, sortBy]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-approval mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-approval mx-auto py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Requests</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPendingRequests}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-approval mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Requests</h1>
          <p className="text-muted-foreground">
            Manage employee attendance requests and approvals
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredAndSortedRequests.length} requests
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'status') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <AnimatePresence>
        {filteredAndSortedRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'There are no pending requests at the moment.'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Employee Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{request.employeeName}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Request: {formatDate(request.requestDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Log: {formatDate(request.logDate)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Type: </span>
                              {request.requestedStatus}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>

                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {/* Type Selection */}
                            <div className="flex gap-2">
                              <Button
                                variant={approvalType[request.id] === 'full day' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeChange(request.id, 'full day')}
                                className="text-xs"
                              >
                                Full Day
                              </Button>
                              <Button
                                variant={approvalType[request.id] === 'half day' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTypeChange(request.id, 'half day')}
                                className="text-xs"
                              >
                                Half Day
                              </Button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproval(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApproval(request.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
