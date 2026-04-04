import { db } from '../db/database';
import type { DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalCourses,
      activeCourses,
      pendingRequests,
      allPayments,
      paidPayments,
      pendingPayments,
    ] = await Promise.all([
      db.users.count(),
      db.courses.count(),
      db.courses.where('status').equals('active').count(),
      db.requests.where('status').equals('pending').count(),
      db.payments.toArray(),
      db.payments.where('status').equals('paid').toArray(),
      db.payments.where('status').equals('pending').toArray(),
    ]);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalUsers,
      totalCourses,
      activeCourses,
      pendingRequests,
      totalPayments: allPayments.length,
      paidPayments: paidPayments.length,
      pendingPayments: pendingPayments.length,
      totalRevenue,
    };
  },
};
