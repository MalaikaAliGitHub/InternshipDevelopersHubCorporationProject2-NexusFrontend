import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

type NavState = {
  transactionId?: string | null;
  service?: string;
  amount?: number;
  status?: 'pending' | 'success' | 'failed';
  user?: { name?: string; email?: string } | null;
};

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const s = (state || {}) as NavState;

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'red' }}>❌ Payment Failed</h1>

      <p><strong>Transaction ID:</strong> {s.transactionId || 'N/A'}</p>
      <p><strong>Service:</strong> {s.service || 'N/A'}</p>
      <p><strong>Amount:</strong> ${s.amount ?? 'N/A'}</p>
      <p>
        <strong>User:</strong>{' '}
        {s.user?.name ? `${s.user.name}` : 'N/A'}
        {s.user?.email ? ` (${s.user.email})` : ''}
      </p>
      <p><strong>Status:</strong> {s.status || 'failed'}</p>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button onClick={() => navigate(-1)}>Retry Payment</Button>
        <Button onClick={() => navigate('/dashboard/entrepreneur')}>Go to Dashboard</Button>
      </div>
    </div>
  );
};

export default PaymentFailed;
