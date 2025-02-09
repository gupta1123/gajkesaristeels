import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import './Approval.css';

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

export default function Approval({ authToken }: { authToken: string }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalType, setApprovalType] = useState<{ [key: number]: 'full day' | 'half day' | null }>({});

  useEffect(() => {
    fetchPendingRequests();
  }, [authToken]);

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get<ApprovalRequest[]>(
        'https://api.gajkesaristeels.in/request/getByStatus?status=pending',
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch pending requests. Please try again later.');
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

  if (loading) {
    return <div className="loadingMessage">Loading pending requests...</div>;
  }

  if (error) {
    return <div className="errorMessage">{error}</div>;
  }

  return (
    <div className="approvalContainer">
      <h2 className="approvalTitle">Approval Requests</h2>
      {requests.length === 0 ? (
        <div className="noRequests">No pending requests at the moment.</div>
      ) : (
        requests.map(request => (
          <div key={request.id} className="approvalCard">
            <div className="approvalCardHeader">
              <span className="employeeName">{request.employeeName}</span>
              <span className={`statusBadge status${request.status}`}>
                {request.status}
              </span>
            </div>
            <div className="approvalCardContent">
              <div className="requestDetails">
                <p className="requestDetail">Requested Date: {request.requestDate}</p>
                <p className="requestDetail">Log Date: {request.logDate}</p>
                <p className="requestDetail">Requested Type: {request.requestedStatus}</p>
              </div>
              {request.status === 'pending' && (
                <div className="approvalActions">
                  <div className="approvalTypeSelection">
                    <label>
                      <input
                        type="radio"
                        name={`approvalType_${request.id}`}
                        value="full day"
                        checked={approvalType[request.id] === 'full day'}
                        onChange={() => handleTypeChange(request.id, 'full day')}
                      /> Full Day
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`approvalType_${request.id}`}
                        value="half day"
                        checked={approvalType[request.id] === 'half day'}
                        onChange={() => handleTypeChange(request.id, 'half day')}
                      /> Half Day
                    </label>
                  </div>
                  <div className="approvalButtons">
                    <button
                      className="approveButton"
                      onClick={() => handleApproval(request.id, 'approved')}
                    >
                      <CheckCircle size={16} />
                      <span>Approve</span>
                    </button>
                    <button
                      className="rejectButton"
                      onClick={() => handleApproval(request.id, 'rejected')}
                    >
                      <XCircle size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}