import { db } from '../db/database';
import type { Course, CourseFormData, CourseWithStats } from '../types';

export const courseService = {
  async getAll(): Promise<Course[]> {
    return db.courses.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: number): Promise<Course | undefined> {
    return db.courses.get(id);
  },

  async getAllWithStats(): Promise<CourseWithStats[]> {
    const courses = await db.courses.orderBy('createdAt').reverse().toArray();
    const results: CourseWithStats[] = [];

    for (const course of courses) {
      const requestCount = await db.requests
        .where('courseId')
        .equals(course.id!)
        .count();

      const payments = await db.payments
        .where('courseId')
        .equals(course.id!)
        .and((p) => p.status === 'paid')
        .toArray();

      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      results.push({ ...course, requestCount, paidAmount });
    }

    return results;
  },

  async create(data: CourseFormData): Promise<Course> {
    const now = Date.now();
    const id = await db.courses.add({
      name: data.name,
      description: data.description,
      category: data.category,
      level: data.level,
      format: data.format,
      duration: Number(data.duration),
      price: Number(data.price),
      maxStudents: Number(data.maxStudents),
      currentStudents: 0,
      instructor: data.instructor || undefined,
      location: data.location || undefined,
      startDate: data.startDate ? new Date(data.startDate).getTime() : undefined,
      endDate: data.endDate ? new Date(data.endDate).getTime() : undefined,
      status: data.status,
      objectives: data.objectives || undefined,
      targetAudience: data.targetAudience || undefined,
      tags: data.tags || undefined,
      createdAt: now,
      updatedAt: now,
    });
    return (await db.courses.get(id as number))!;
  },

  async update(id: number, data: Partial<CourseFormData>): Promise<void> {
    const patch: Partial<Course> = {
      updatedAt: Date.now(),
    };
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.category !== undefined) patch.category = data.category;
    if (data.level !== undefined) patch.level = data.level;
    if (data.format !== undefined) patch.format = data.format;
    if (data.duration !== undefined) patch.duration = Number(data.duration);
    if (data.price !== undefined) patch.price = Number(data.price);
    if (data.maxStudents !== undefined) patch.maxStudents = Number(data.maxStudents);
    if (data.instructor !== undefined) patch.instructor = data.instructor || undefined;
    if (data.location !== undefined) patch.location = data.location || undefined;
    if (data.startDate !== undefined)
      patch.startDate = data.startDate ? new Date(data.startDate).getTime() : undefined;
    if (data.endDate !== undefined)
      patch.endDate = data.endDate ? new Date(data.endDate).getTime() : undefined;
    if (data.status !== undefined) patch.status = data.status;
    if (data.objectives !== undefined) patch.objectives = data.objectives || undefined;
    if (data.targetAudience !== undefined) patch.targetAudience = data.targetAudience || undefined;
    if (data.tags !== undefined) patch.tags = data.tags || undefined;

    await db.courses.update(id, patch);
  },

  async delete(id: number): Promise<void> {
    await db.requests.where('courseId').equals(id).delete();
    await db.payments.where('courseId').equals(id).delete();
    await db.courses.delete(id);
  },

  async getActive(): Promise<Course[]> {
    return db.courses.where('status').equals('active').toArray();
  },

  async getUpcoming(): Promise<Course[]> {
    const now = Date.now();
    const all = await db.courses
      .where('status')
      .equals('active')
      .toArray();
    return all
      .filter((c) => c.startDate && c.startDate > now)
      .sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0))
      .slice(0, 5);
  },

  async incrementStudents(id: number): Promise<void> {
    const course = await db.courses.get(id);
    if (!course) return;
    await db.courses.update(id, {
      currentStudents: course.currentStudents + 1,
      updatedAt: Date.now(),
    });
  },
};
