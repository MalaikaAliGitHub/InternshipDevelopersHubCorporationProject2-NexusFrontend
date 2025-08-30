import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const API_BASE_URL = "https://internshipdevelopershubcorporationproject2-nexus-production.up.railway.app";

type InitiateResponse = {
  message: string;
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  service: string;
  amount: number;
  user?: { name?: string; email?: string };
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  // Service selection (URL ?service=... allowed, else default 'meeting')
  const [serviceType, setServiceType] = useState<string>(params.get('service') || 'meeting');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const getAmount = (svc: string) => {
    switch (svc) {
      case 'meeting': return 500;
      case 'document': return 200;
      case 'consulting': return 300;
      default: return 100;
    }
  };
  const amount = getAmount(serviceType);

  // --- API Calls ---
  const initiatePayment = async (): Promise<InitiateResponse | null> => {
    try {
      setErr(null);
      const res = await fetch(`${API_BASE_URL}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token from localStorage; adjust if you have useAuth()
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ service: serviceType, amount }),
      });
      const data = (await res.json()) as InitiateResponse;
      if (!res.ok) {
        setErr(data?.message || 'Failed to initiate payment');
        return null;
      }
      return data;
    } catch (e: any) {
      setErr(e?.message || 'Network error while initiating payment');
      return null;
    }
  };

  const confirmPayment = async (transactionId: string, status: 'success' | 'failed') => {
    try {
      await fetch(`${API_BASE_URL}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status }),
      });
    } catch {
      // keep silent for demo; backend confirmation failure won't block UX
    }
  };

  // --- Handlers ---
  const handlePayNow = async () => {
    setLoading(true);
    const initiated = await initiatePayment();
    if (!initiated) { setLoading(false); return; }

    // Simulated gateway result
    const isSuccess = Math.random() > 0.3;
    const status: 'success' | 'failed' = isSuccess ? 'success' : 'failed';

    await confirmPayment(initiated.transactionId, status);

    const navState = {
      transactionId: initiated.transactionId,
      service: initiated.service,
      amount: initiated.amount,
      status,
      user: initiated.user,
    };

    setLoading(false);
    if (isSuccess) {
      navigate('/payment/success', { state: navState });
    } else {
      navigate('/payment/failed', { state: navState });
    }
  };

  // Simulate Failure (NO DB touch)
  const simulateFailure = () => {
    navigate('/payment/failed', {
      state: {
        transactionId: null,
        service: serviceType,
        amount,
        status: 'failed',
        user: null,
      },
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Payment</h1>

      <div style={{ display: 'grid', gap: '12px', marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Select Service:
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            style={{ padding: '8px', flex: 1 }}
            disabled={loading}
          >
            <option value="meeting">Meeting</option>
            <option value="document">Document</option>
            <option value="consulting">Consulting</option>
          </select>
        </label>

        <div>
          Amount:&nbsp;<strong>${amount}</strong>
        </div>

        {err && (
          <div style={{ padding: '8px', borderRadius: 8, background: '#fee', border: '1px solid #f99' }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
          <Button onClick={handlePayNow} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Processing…' : 'Pay Now'}
          </Button>

          <Button
            onClick={simulateFailure}
            disabled={loading}
            style={{ backgroundColor: 'red', color: 'white' }}
          >
            Simulate Failure (No DB)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
