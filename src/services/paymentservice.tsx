// src/services/paymentService.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/payment',
  withCredentials: true // if your backend uses cookies; otherwise optional
});

export const initiatePayment = (token: string, service: string, amount: number) => {
  return API.post('/initiate', { service, amount }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const confirmPayment = (token: string, transactionId: string, status: 'success' | 'failed') => {
  return API.post('/confirm', { transactionId, status }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
