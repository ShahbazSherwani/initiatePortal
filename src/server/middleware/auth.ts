import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import serviceAccount from '../firebase-service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
