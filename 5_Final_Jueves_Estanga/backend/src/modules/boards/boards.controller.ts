import { RequestHandler } from 'express';
import { boardsService } from './boards.service';
import { boardFiltersSchema } from './boards.schemas';

export const listBoards: RequestHandler = async (req, res, next) => {
  try {
    const filters = boardFiltersSchema.parse(req.query);
    const result = await boardsService.getAll(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getBoard: RequestHandler = async (req, res, next) => {
  try {
    const board = await boardsService.getById(req.params.id!);
    res.status(200).json({ data: board });
  } catch (error) {
    next(error);
  }
};

export const getAvailability: RequestHandler = async (req, res, next) => {
  try {
    const availability = await boardsService.getAvailability(req.params.id!);
    res.status(200).json({ data: availability });
  } catch (error) {
    next(error);
  }
};

export const createBoard: RequestHandler = async (req, res, next) => {
  try {
    const board = await boardsService.create(req.user!.id, req.body);
    res.status(201).json({ data: board });
  } catch (error) {
    next(error);
  }
};

export const updateBoard: RequestHandler = async (req, res, next) => {
  try {
    const board = await boardsService.update(
      req.user!.id,
      req.user!.role,
      req.params.id!,
      req.body
    );
    res.status(200).json({ data: board });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard: RequestHandler = async (req, res, next) => {
  try {
    const result = await boardsService.delete(req.user!.id, req.user!.role, req.params.id!);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyBoards: RequestHandler = async (req, res, next) => {
  try {
    const boards = await boardsService.getMyBoards(req.user!.id);
    res.status(200).json({ status: 'success', data: boards });
  } catch (error) {
    next(error);
  }
};

