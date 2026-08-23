import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { Task, TaskStatus } from '../src/models/task.model';
import { connectTestDB, clearTestDB, closeTestDB } from './testUtils';

describe('POST /list', () => {
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

  it('crea una tarea nueva con los datos enviados', async () => {
    const payload = {
      title: 'Comprar leche',
      description: 'Ir al supermercado',
      status: TaskStatus.PENDING,
    };

    const res = await request(app).post('/list').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(payload);
    expect(res.body._id).toBeDefined();

    const stored = await Task.findById(res.body._id);
    expect(stored).not.toBeNull();
    expect(stored?.title).toBe(payload.title);
  });

  it('asigna estado "pending" por defecto cuando no se envia', async () => {
    const res = await request(app)
      .post('/list')
      .send({ title: 'Sin estado', description: 'Desc' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(TaskStatus.PENDING);
  });

  it('devuelve 400 cuando falta el titulo', async () => {
    const res = await request(app).post('/list').send({ description: 'Sin titulo' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/titulo/i);
  });
});
