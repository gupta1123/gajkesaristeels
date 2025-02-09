import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import './VisitsTimeline.css';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

interface Visit {
  id: string;
  visit_date: string;
  purpose: string;
  storeName: string;
  employeeName: string;
  feedback?: string;
}

export default function VisitsTimeline({ storeId }: { storeId: string }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAll, setShowAll] = useState<boolean>(false);
  const visitsPerPage = 3;
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchVisits = useCallback(async () => {
    try {
      const response = await fetch(`https://api.gajkesaristeels.in/visit/getByStore?id=${storeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: Visit[] = await response.json();
      const sortedVisits = data.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
      setVisits(sortedVisits);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to fetch visits.');
      setIsLoading(false);
    }
  }, [storeId, token]);

  useEffect(() => {
    if (storeId && token) {
      fetchVisits();
    }
  }, [storeId, token, fetchVisits]);

  if (isLoading) {
    return <div>Loading visits...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const indexOfLastVisit = currentPage * visitsPerPage;
  const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
  const currentVisits = showAll ? visits.slice(indexOfFirstVisit, indexOfLastVisit) : visits.slice(0, 3);
  const totalPages = Math.ceil(visits.length / visitsPerPage);

  const getPaginationGroup = (totalPages: number, itemsPerPage: number) => {
    const start = Math.floor((currentPage - 1) / itemsPerPage) * itemsPerPage;
    return new Array(itemsPerPage)
      .fill(0)
      .map((_, idx) => start + idx + 1)
      .filter((page) => page <= totalPages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visits Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="timeline">
          {currentVisits.map((visit) => (
            <div key={visit.id} className="timeline-item">
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-date">{visit.visit_date}</div>
                  <Link href={`/VisitDetailPage/[id]`} as={`/VisitDetailPage/${visit.id}`} passHref>
                    <div className="timeline-visit-id">Visit ID: {visit.id}</div>
                  </Link>
                </div>
                <div className="timeline-title">{visit.purpose}</div>
                <div className="timeline-description">
                  <p>Store: {visit.storeName}</p>
                  <p>Employee: {visit.employeeName}</p>
                  {visit.feedback && <p>Feedback: {visit.feedback}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {visits.length > 3 && (
          <div className="mt-4">
            <Button onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        )}
        {showAll && (
          <div className="pagination-container mt-4">
            <Pagination>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "disabled" : ""}
              >
                Previous
              </PaginationPrevious>
              <PaginationContent>
                {getPaginationGroup(totalPages, visitsPerPage).map((page, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "disabled" : ""}
              >
                Next
              </PaginationNext>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
