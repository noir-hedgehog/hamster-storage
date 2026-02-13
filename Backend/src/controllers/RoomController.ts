import { Request, Response } from 'express';
import { RoomModel } from '../models/RoomModel';
import { CreateRoomDto, UpdateRoomDto } from '../types';

export class RoomController {
  static async getAll(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      
      let rooms;
      if (locationId) {
        rooms = RoomModel.findByLocationId(locationId as string);
      } else {
        rooms = RoomModel.findAll();
      }
      
      res.json({ success: true, data: rooms });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取房间列表失败' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const room = RoomModel.findById(id);
      
      if (!room) {
        return res.status(404).json({ success: false, error: '房间不存在' });
      }
      
      res.json({ success: true, data: room });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取房间失败' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data: CreateRoomDto = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ success: false, error: '房间名称不能为空' });
      }

      if (!data.locationId) {
        return res.status(400).json({ success: false, error: '地点ID不能为空' });
      }

      const room = RoomModel.create(data);
      res.status(201).json({ success: true, data: room });
    } catch (error) {
      res.status(500).json({ success: false, error: '创建房间失败' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateRoomDto = req.body;

      const room = RoomModel.update(id, data);
      
      if (!room) {
        return res.status(404).json({ success: false, error: '房间不存在' });
      }

      res.json({ success: true, data: room });
    } catch (error) {
      res.status(500).json({ success: false, error: '更新房间失败' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = RoomModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: '房间不存在' });
      }

      res.json({ success: true, message: '房间已删除' });
    } catch (error) {
      res.status(500).json({ success: false, error: '删除房间失败' });
    }
  }
}
