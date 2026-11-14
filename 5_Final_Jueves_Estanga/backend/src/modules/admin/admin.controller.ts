import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

export const getAdminOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.getOverview();
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const createZoneAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.createZone(req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const updateZoneAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.updateZone(String(req.params.id), req.body);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const deleteZoneAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.deleteZone(String(req.params.id));
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const createAgencyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.createAgencyWithOptionalOperator(req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const updateAgencyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.updateAgency(String(req.params.id), req.body);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const createAgencyOperatorAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.createAgencyOperator(req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const updateUserRoleAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const actingAdminId = (req as any).user.id;
    const data = await adminService.updateUserRoleAndAgency(
      String(req.params.id),
      req.body,
      actingAdminId
    );
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const createBoardInLocationAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const actingAdminId = (req as any).user.id;
    const data = await adminService.createBoardInLocation(actingAdminId, req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const relocateBoardAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.relocateBoard(String(req.params.id), req.body);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};
