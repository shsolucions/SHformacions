import { db } from '../db/database';
import type { Payment, PaymentFormData, PaymentWithDetails } from '../types';

export const paymentService = {
  async getAll(): Promise<PaymentWithDetails[]> {
    const payments = await db.payments.orderBy('createdAt').reverse().toArray();
    return enrichPayments(payments);
  },

  async getByUser(userId: number): Promise<PaymentWithDetails[]> {
    const payments = await db.payments
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
    return enrichPayments(payments);
  },

  async getById(id: number): Promise<PaymentWithDetails | undefined> {
    const payment = await db.payments.get(id);
    if (!payment) return undefined;
    const [enriched] = await enrichPayments([payment]);
    return enriched;
  },

  async create(data: PaymentFormData): Promise<Payment> {
    const now = Date.now();
    const id = await db.payments.add({
      userId: Number(data.userId),
      courseId: data.courseId ? Number(data.courseId) : undefined,
      amount: Number(data.amount),
      status: data.status,
      method: data.method,
      concept: data.concept || undefined,
      notes: data.notes || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
      paidAt: data.status === 'paid' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
    return (await db.payments.get(id as number))!;
  },

  async update(id: number, data: Partial<PaymentFormData>): Promise<void> {
    const existing = await db.payments.get(id);
    if (!existing) return;

    const patch: Partial<Payment> = { updatedAt: Date.now() };
    if (data.userId !== undefined) patch.userId = Number(data.userId);
    if (data.courseId !== undefined) patch.courseId = data.courseId ? Number(data.courseId) : undefined;
    if (data.amount !== undefined) patch.amount = Number(data.amount);
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === 'paid' && !existing.paidAt) {
        patch.paidAt = Date.now();
      }
    }
    if (data.method !== undefined) patch.method = data.method;
    if (data.concept !== undefined) patch.concept = data.concept || undefined;
    if (data.notes !== undefined) patch.notes = data.notes || undefined;
    if (data.dueDate !== undefined)
      patch.dueDate = data.dueDate ? new Date(data.dueDate).getTime() : undefined;

    await db.payments.update(id, patch);
  },

  async markAsPaid(id: number): Promise<void> {
    await db.payments.update(id, {
      status: 'paid',
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.payments.delete(id);
  },

  async getTotalRevenue(): Promise<number> {
    const paid = await db.payments.where('status').equals('paid').toArray();
    return paid.reduce((sum, p) => sum + p.amount, 0);
  },

  async getPendingAmount(): Promise<number> {
    const pending = await db.payments.where('status').equals('pending').toArray();
    return pending.reduce((sum, p) => sum + p.amount, 0);
  },

  async getSummary(): Promise<{
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
    totalPending: number;
  }> {
    const all = await db.payments.toArray();
    const paid = all.filter((p) => p.status === 'paid');
    const pending = all.filter((p) => p.status === 'pending');
    const cancelled = all.filter((p) => p.status === 'cancelled');
    return {
      total: all.length,
      paid: paid.length,
      pending: pending.length,
      cancelled: cancelled.length,
      totalRevenue: paid.reduce((s, p) => s + p.amount, 0),
      totalPending: pending.reduce((s, p) => s + p.amount, 0),
    };
  },
};

async function enrichPayments(payments: Payment[]): Promise<PaymentWithDetails[]> {
  const results: PaymentWithDetails[] = [];
  for (const payment of payments) {
    const user = await db.users.get(payment.userId);
    const course = payment.courseId ? await db.courses.get(payment.courseId) : undefined;
    results.push({
      ...payment,
      userName: user?.name ?? user?.nickname ?? 'Usuari desconegut',
      courseName: course?.name,
    });
  }
  return results;
}
