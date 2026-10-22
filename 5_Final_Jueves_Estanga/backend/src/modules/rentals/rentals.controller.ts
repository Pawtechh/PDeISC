import { Request, Response, NextFunction } from 'express';
import { rentalsService } from './rentals.service';

export const getQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await rentalsService.getQuote(req.body);
    res.json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const createRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const ipAceptacion = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const result = await rentalsService.createRental(consumerId, {
      ...req.body,
      ipAceptacion,
    });
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyRentals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const rentals = await rentalsService.getMyRentals(consumerId);
    res.json({
      status: 'success',
      data: rentals,
    });
  } catch (err) {
    next(err);
  }
};

export const getRentalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const rental = await rentalsService.getRentalById(req.params.id as string, user.id, user.role);
    res.json({
      status: 'success',
      data: rental,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const result = await rentalsService.cancelRental(req.params.id as string, consumerId, req.body);
    res.json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const registrarRetiro = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { agencyService } = await import('../agency/agency.service');
    const operatorId = (req as any).user.id;
    const result = await agencyService.checkIn(
      { ...req.body, rentalId: req.params.id as string },
      operatorId
    );
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const registrarDevolucion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { agencyService } = await import('../agency/agency.service');
    const operatorId = (req as any).user.id;
    const result = await agencyService.checkOut(
      { ...req.body, rentalId: req.params.id as string },
      operatorId
    );
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const evaluarDanos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ownerService } = await import('../owner/owner.service');
    const ownerId = (req as any).user.id;
    const rentalId = req.params.id as string;
    if (req.body.tieneDanio) {
      const claim = await ownerService.reportDamageClaim(ownerId, {
        rentalId,
        descripcion: req.body.descripcionDanio || req.body.descripcion || 'Daño reportado por dueño',
        fotosDano: req.body.fotosDano || [],
        montoReclamado: req.body.montoReclamado || 15000,
        presupuestoReparacionUrl: req.body.presupuestoReparacionUrl,
      });
      res.status(201).json({ status: 'success', data: claim });
    } else {
      const result = await ownerService.approveRevision(ownerId, rentalId);
      res.status(200).json({ status: 'success', data: result });
    }
  } catch (err) {
    next(err);
  }
};

export const signRentalBiometric = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rentalId = req.params.id || req.body.rental_id || req.body.rentalId;
    const userId = (req as any).user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'SurfRentalBiometricClient/1.0';
    const { LegalService } = await import('../legal/legal.service');
    const legalService = new LegalService();

    const signatureHash = req.body.signature_hash || req.body.signatureHash || req.body.signature || `BIO-${Date.now()}`;
    const timestamp = req.body.timestamp || new Date().toISOString();

    const result = await legalService.recordBiometricSignature({
      userId,
      rentalId,
      biometricVerified: true,
      timestamp,
      signatureHash,
      ipAddress: String(ipAddress),
      userAgent,
    });

    res.status(200).json({
      status: 'success',
      message: 'Firma biométrica registrada exitosamente en alquiler',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

