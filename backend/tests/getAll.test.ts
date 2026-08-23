import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { Task, TaskStatus } from '../src/models/task.model';
import { connectTestDB, clearTestDB, closeTestDB } from './testUtils';

describe('GET /list', () => {
  let app: Application;

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('devuelve una lista vacia cuando no hay tareas', async () => {
    const res = await request(app).get('/list');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('devuelve todas las tareas existentes', async () => {
    await Task.create([
      { title: 'Tarea 1', description: 'Desc 1', status: TaskStatus.PENDING },
      { title: 'Tarea 2', description: 'Desc 2', status: TaskStatus.COMPLETED },
    ]);

    const res = await request(app).get('/list');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const titles = res.body.map((t: { title: string }) => t.title);
    expect(titles).toEqual(expect.arrayContaining(['Tarea 1', 'Tarea 2']));
  });
});
