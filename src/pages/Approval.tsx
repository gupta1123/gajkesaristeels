// This component has been moved to ApprovalPage.tsx as a standalone page
// This file is kept for backward compatibility but redirects to the new page
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Approval({ authToken }: { authToken: string }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new standalone approval page
    router.replace('/ApprovalPage');
  }, [router]);

  return null;
}