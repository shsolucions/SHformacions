import { db } from '../db/database';
import type { ServiceRequest, RequestWithDetails } from '../types';
import { courseService } from './courseService';

export const requestService = {
  async getAll(): Promise<RequestWithDetails[]> {
    const requests = await db.requests.orderBy('createdAt').reverse().toArray();
    return enrichRequests(requests);
  },

  async getByUser(userId: number): Promise<RequestWithDetails[]> {
    const requests = await db.requests
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
    return enrichRequests(requests);
  },

  async getByCourse(courseId: number): Promise<RequestWithDetails[]> {
    const requests = await db.requests
      .where('courseId')
      .equals(courseId)
      .reverse()
      .sortBy('createdAt');
    return enrichRequests(requests);
  },

  async getPending(): Promise<RequestWithDetails[]> {
    const requests = await db.requests
      .where('status')
      .equals('pending')
      .toArray();
    return enrichRequests(requests);
  },

  async create(
    userId: number,
    courseId: number,
    message?: string
  ): Promise<ServiceRequest> {
    // Check for existing request
    const existing = await db.requests
      .where('userId')
      .equals(userId)
      .and((r) => r.courseId === courseId)
      .first();
    if (existing) throw new Error('request_exists');

    const now = Date.now();
    const id = await db.requests.add({
      userId,
      courseId,
      status: 'pending',
      message: message || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await courseService.incrementStudents(courseId);

    return (await db.requests.get(id as number))!;
  },

  async updateStatus(
    id: number,
    status: ServiceRequest['status'],
    adminNotes?: string
  ): Promise<void> {
    await db.requests.update(id, {
      status,
      adminNotes: adminNotes || undefined,
      updatedAt: Date.now(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.requests.delete(id);
  },

  async countByStatus(status: ServiceRequest['status']): Promise<number> {
    return db.requests.where('status').equals(status).count();
  },
};

async function enrichRequests(
  requests: ServiceRequest[]
): Promise<RequestWithDetails[]> {
  const results: RequestWithDetails[] = [];
  for (const req of requests) {
    const user = await db.users.get(req.userId);
    const course = await db.courses.get(req.courseId);
    results.push({
      ...req,
      userName: user?.name ?? user?.nickname ?? 'Usuari desconegut',
      courseName: course?.name ?? 'Curs desconegut',
      courseCategory: course?.category,
    });
  }
  return results;
}
