import { asyncHandler } from '../middleware/errorHandler.js';
import * as svc from '../services/task.service.js';

export const list = asyncHandler(async (req, res) => {
  const { status, priority, search } = req.query;
  const tasks = await svc.listTasks(req.user.id, req.params.projectId, { status, priority, search });
  res.json({ tasks });
});

export const create = asyncHandler(async (req, res) => {
  const task = await svc.createTask(req.user.id, req.params.projectId, req.body);
  res.status(201).json({ task });
});

export const detail = asyncHandler(async (req, res) => {
  const result = await svc.getTask(req.user.id, req.params.id);
  res.json(result);
});

export const update = asyncHandler(async (req, res) => {
  const task = await svc.updateTask(req.user.id, req.params.id, req.body);
  res.json({ task });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const task = await svc.updateStatus(req.user.id, req.params.id, req.body.status);
  res.json({ task });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteTask(req.user.id, req.params.id);
  res.json({ ok: true });
});

export const logs = asyncHandler(async (req, res) => {
  const logs = await svc.getTaskLogs(req.user.id, req.params.id);
  res.json({ logs });
});
