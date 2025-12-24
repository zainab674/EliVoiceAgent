import { useState, useEffect } from 'react';
import { PaymentMethodsCard } from "./billing/PaymentMethodsCard";
import { InvoiceHistoryCard } from "./billing/InvoiceHistoryCard";
import { MainHeading, BodyText } from "@/components/ui/typography";
import { useAuth } from '@/contexts/SupportAccessAuthContext';

import { Loader2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending";
}

export function BillingSettings() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

        // Fetch payment methods
        try {
          const res = await fetch(`${backendUrl}/api/v1/billing/payment-methods`, { headers });
          const json = await res.json();
          if (json.success && json.paymentMethods) {
            setPaymentMethods(json.paymentMethods.map((pm: any) => ({
              id: pm._id,
              type: (pm.cardBrand || 'card').toLowerCase(),
              last4: pm.last4,
              expMonth: pm.expMonth,
              expYear: pm.expYear,
              isDefault: pm.isDefault
            })));
          } else {
            setPaymentMethods([]);
          }
        } catch (e) {
          console.error("Error fetching payment methods", e);
          setPaymentMethods([]);
        }

        // Fetch invoices
        try {
          const res = await fetch(`${backendUrl}/api/v1/billing/invoices`, { headers });
          const json = await res.json();
          let allInvoices: Invoice[] = [];

          if (json.success) {
            if (json.invoices) {
              allInvoices = [...allInvoices, ...json.invoices.map((inv: any) => ({
                id: inv._id || inv.invoiceNumber || `INV-${inv._id?.slice(0, 8)}`,
                date: new Date(inv.date).toISOString().split('T')[0],
                amount: `$${Number(inv.amount || 0).toFixed(2)}`,
                status: (inv.status || 'paid') as "paid" | "pending"
              }))];
            }
            if (json.minutesPurchases) {
              allInvoices = [...allInvoices, ...json.minutesPurchases.map((mp: any) => ({
                id: `MIN-${mp._id.slice(0, 8)}`,
                date: new Date(mp.createdAt).toISOString().split('T')[0],
                amount: `$${Number(mp.amount_paid || 0).toFixed(2)}`,
                status: (mp.status === 'completed' ? 'paid' : 'pending') as "paid" | "pending"
              }))];
            }
          }
          // Sort by date descending
          allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setInvoices(allInvoices);
        } catch (e) {
          console.error("Error fetching invoices", e);
          setInvoices([]);
        }

      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extralight tracking-tight text-foreground">Billing & Payment Methods</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Manage your payment information and view transaction history
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extralight tracking-tight text-foreground">Billing & Payment Methods</h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Manage your payment information and view transaction history
        </p>
      </div>

      <div className="space-y-6">
        <PaymentMethodsCard paymentMethods={paymentMethods} />
        <InvoiceHistoryCard invoices={invoices} />
      </div>
    </div>
  );
}
