import { asyncHandler } from '../middleware/errorHandler.js';
import * as svc from '../services/project.service.js';

export const list = asyncHandler(async (req, res) => {
  const { search, status, role, sort, dir } = req.query;
  const projects = await svc.listProjects(req.user.id, { search, status, role, sort, dir });
  res.json({ projects });
});

export const create = asyncHandler(async (req, res) => {
  const project = await svc.createProject(req.user.id, req.body);
  res.status(201).json({ project });
});

export const detail = asyncHandler(async (req, res) => {
  const project = await svc.getProject(req.user.id, req.params.id);
  res.json({ project });
});

export const update = asyncHandler(async (req, res) => {
  const project = await svc.updateProject(req.user.id, req.params.id, req.body);
  res.json({ project });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteProject(req.user.id, req.params.id);
  res.json({ ok: true });
});

export const logs = asyncHandler(async (req, res) => {
  const logs = await svc.getProjectLogs(req.user.id, req.params.id);
  res.json({ logs });
});

export const addCollaborator = asyncHandler(async (req, res) => {
  const collaborators = await svc.addCollaborator(req.user.id, req.params.id, req.body.email);
  res.status(201).json({ collaborators });
});

export const removeCollaborator = asyncHandler(async (req, res) => {
  const collaborators = await svc.removeCollaborator(req.user.id, req.params.id, req.params.userId);
  res.json({ collaborators });
});
