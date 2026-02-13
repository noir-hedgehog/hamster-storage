import { describe, it, expect, beforeEach } from 'vitest';
import { LocationModel } from '../../models/LocationModel';

describe('LocationModel', () => {
  beforeEach(() => {
    // 清理测试数据
    const locations = LocationModel.findAll();
    locations.forEach(loc => LocationModel.delete(loc.id));
  });

  describe('create', () => {
    it('should create a new location', () => {
      const location = LocationModel.create({
        name: '测试地点',
        icon: 'home',
      });

      expect(location).toBeDefined();
      expect(location.name).toBe('测试地点');
      expect(location.type).toBe('location');
      expect(location.id).toBeDefined();
    });

    it('should create location without icon', () => {
      const location = LocationModel.create({
        name: '测试地点2',
      });

      expect(location.name).toBe('测试地点2');
    });
  });

  describe('findAll', () => {
    it('should return all locations', () => {
      LocationModel.create({ name: '地点1' });
      LocationModel.create({ name: '地点2' });

      const locations = LocationModel.findAll();
      expect(locations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findById', () => {
    it('should find location by id', () => {
      const created = LocationModel.create({ name: '测试地点' });
      const found = LocationModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('测试地点');
    });

    it('should return null for non-existent id', () => {
      const found = LocationModel.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update location', () => {
      const created = LocationModel.create({ name: '原始名称' });
      const updated = LocationModel.update(created.id, { name: '新名称' });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('新名称');
    });

    it('should return null for non-existent id', () => {
      const updated = LocationModel.update('non-existent', { name: '新名称' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete location', () => {
      const created = LocationModel.create({ name: '待删除' });
      const deleted = LocationModel.delete(created.id);

      expect(deleted).toBe(true);
      const found = LocationModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const deleted = LocationModel.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});
