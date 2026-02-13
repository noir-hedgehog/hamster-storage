import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../services/api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Locations API', () => {
    it('should get all locations', async () => {
      const mockLocations = [
        { id: '1', name: '主住所', type: 'location' },
        { id: '2', name: '办公室', type: 'location' },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLocations }),
      });

      const result = await apiClient.getLocations();
      expect(result).toEqual(mockLocations);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/locations'),
        expect.any(Object)
      );
    });

    it('should create a location', async () => {
      const newLocation = { id: '1', name: '新地点', type: 'location' };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: newLocation }),
      });

      const result = await apiClient.createLocation({ name: '新地点' });
      expect(result).toEqual(newLocation);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/locations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: '新地点' }),
        })
      );
    });
  });

  describe('Items API', () => {
    it('should get items with filters', async () => {
      const mockItems = [{ id: '1', name: '物品1', storageId: 'stor_1' }];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockItems }),
      });

      const result = await apiClient.getItems({ storageId: 'stor_1', search: '物品' });
      expect(result).toEqual(mockItems);
      // URL 会被编码，所以检查编码后的版本或使用更灵活的匹配
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/items\?.*storageId=stor_1.*search=/),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error on API failure', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'API Error' }),
      });

      await expect(apiClient.getLocations()).rejects.toThrow();
    });
  });
});
