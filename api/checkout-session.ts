import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
  if (!SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no configurat al servidor' });
  }

  try {
    const stripe = new Stripe(SECRET_KEY);
    const { amount, description } = req.body as { amount: number; description: string };

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Import invàlid' });
    }

    // Usem l'origen de la petició per fer-ho compatible amb qualsevol domini
    const origin = (req.headers.origin as string) || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: description || 'Formació SHformacions',
            description: 'SH Solucions — Formació professional',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/pagament-ok?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pressupost`,
      payment_intent_data: {
        statement_descriptor_suffix: 'SHFORMACIONS',
      },
      locale: 'ca',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
