import { Request, Response } from 'express';
import { ItemModel } from '../models/ItemModel';

export class AlertController {
  static async getAll(req: Request, res: Response) {
    try {
      const alerts = ItemModel.getAlerts();
      
      // 按严重程度排序
      const severityOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      res.json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取提醒列表失败' });
    }
  }
}
