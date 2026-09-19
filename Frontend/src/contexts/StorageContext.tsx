import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Location, Room, Storage, Item, Alert, Category, TagGroup, Tag } from '../types';
import apiClient from '../services/api';

interface StorageContextType {
  locations: Location[];
  rooms: Room[];
  storages: Storage[];
  items: Item[];
  alerts: Alert[];
  categories: Category[];
  tagGroups: TagGroup[];
  tags: Tag[];
  selectedNode: { type: string; id: string } | null;
  loading: boolean;
  error: string | null;
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addStorage: (storage: Omit<Storage, 'id'>) => Promise<void>;
  updateStorage: (id: string, storage: Partial<Storage>) => Promise<void>;
  deleteStorage: (id: string) => Promise<void>;
  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // 分类操作
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  // 标签分组操作
  addTagGroup: (tagGroup: Omit<TagGroup, 'id'>) => Promise<void>;
  updateTagGroup: (id: string, tagGroup: Partial<TagGroup>) => Promise<void>;
  deleteTagGroup: (id: string) => Promise<void>;
  refreshTagGroups: () => Promise<void>;
  // 标签操作
  addTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  refreshTags: () => Promise<void>;
  setSelectedNode: (node: { type: string; id: string } | null) => void;
  getStoragePath: (storageId: string) => string;
  refreshAlerts: () => Promise<void>;
  refreshData: (silent?: boolean) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ type: string; id: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有数据
  const refreshData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const [
        locationsData, 
        roomsData, 
        storagesData, 
        itemsData, 
        alertsData,
        categoriesData,
        tagGroupsData,
        tagsData
      ] = await Promise.all([
        apiClient.getLocations(),
        apiClient.getRooms(),
        apiClient.getStorages(),
        apiClient.getItems(),
        apiClient.getAlerts(),
        apiClient.getCategories(),
        apiClient.getTagGroups(),
        apiClient.getTags(),
      ]);

      setLocations(locationsData);
      setRooms(roomsData);
      setStorages(storagesData);
      setItems(itemsData);
      setAlerts(alertsData);
      setCategories(categoriesData);
      setTagGroups(tagGroupsData);
      setTags(tagsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      if (silent) throw err;
      setError(errorMessage);
      console.error('Failed to load data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 刷新提醒
  const refreshAlerts = useCallback(async () => {
    try {
      const alertsData = await apiClient.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to refresh alerts:', err);
    }
  }, []);

  // 地点操作
  const addLocation = useCallback(async (location: Omit<Location, 'id'>) => {
    try {
      const newLocation = await apiClient.createLocation({
        name: location.name,
        icon: location.icon,
      });
      setLocations(prev => [...prev, newLocation]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建地点失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateLocation = useCallback(async (id: string, location: Partial<Location>) => {
    try {
      const updated = await apiClient.updateLocation(id, {
        name: location.name,
        icon: location.icon,
        mapX: location.mapX,
        mapY: location.mapY,
      });
      setLocations(prev => prev.map(loc => (loc.id === id ? updated : loc)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新地点失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      await apiClient.deleteLocation(id);
      // 删除相关的房间和收纳位置
      const relatedRooms = rooms.filter(r => r.locationId === id);
      for (const room of relatedRooms) {
        await deleteRoom(room.id);
      }
      setLocations(prev => prev.filter(loc => loc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除地点失败';
      setError(errorMessage);
      throw err;
    }
  }, [rooms]);

  // 房间操作
  const addRoom = useCallback(async (room: Omit<Room, 'id'>) => {
    try {
      const newRoom = await apiClient.createRoom({
        name: room.name,
        locationId: room.locationId,
        icon: room.icon,
      });
      setRooms(prev => [...prev, newRoom]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建房间失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateRoom = useCallback(async (id: string, room: Partial<Room>) => {
    try {
      const updated = await apiClient.updateRoom(id, {
        name: room.name,
        icon: room.icon,
        floorplanX: room.floorplanX,
        floorplanY: room.floorplanY,
        floorplanWidth: room.floorplanWidth,
        floorplanHeight: room.floorplanHeight,
        floorplanRotation: room.floorplanRotation,
      });
      setRooms(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新房间失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteRoom = useCallback(async (id: string) => {
    try {
      await apiClient.deleteRoom(id);
      // 删除相关的收纳位置
      const relatedStorages = storages.filter(s => s.roomId === id);
      for (const storage of relatedStorages) {
        await deleteStorage(storage.id);
      }
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除房间失败';
      setError(errorMessage);
      throw err;
    }
  }, [storages]);

  // 收纳位置操作
  const addStorage = useCallback(async (storage: Omit<Storage, 'id'>) => {
    try {
      const newStorage = await apiClient.createStorage({
        name: storage.name,
        roomId: storage.roomId,
        parentStorageId: storage.parentStorageId,
        description: storage.description,
        icon: storage.icon,
      });
      setStorages(prev => [...prev, newStorage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建收纳位置失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateStorage = useCallback(async (id: string, storage: Partial<Storage>) => {
    try {
      const updated = await apiClient.updateStorage(id, {
        name: storage.name,
        description: storage.description,
        icon: storage.icon,
      });
      setStorages(prev => prev.map(s => (s.id === id ? updated : s)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新收纳位置失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteStorage = useCallback(async (id: string) => {
    try {
      await apiClient.deleteStorage(id);
      setItems(prev => prev.filter(item => item.storageId !== id));
      setStorages(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除收纳位置失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 物品操作
  const addItem = useCallback(async (item: Omit<Item, 'id'>) => {
    try {
      const newItem = await apiClient.createItem({
        name: item.name,
        description: item.description,
        storageId: item.storageId,
        categoryId: item.categoryId,
        brand: item.brand,
        color: item.color,
        attributes: item.attributes || {},
        tagIds: item.tags || [],
        price: item.price,
        purchaseDate: item.purchaseDate,
        depreciationRate: item.depreciationRate,
        expiryDate: item.expiryDate,
        quantity: item.quantity || 1,
        unit: item.unit || '件',
        minThreshold: item.minThreshold,
        maxThreshold: item.maxThreshold,
        rfid: item.rfid,
        barcode: item.barcode,
        images: item.images,
      });
      setItems(prev => [...prev, newItem]);
      await refreshAlerts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建物品失败';
      setError(errorMessage);
      throw err;
    }
  }, [refreshAlerts]);

  const updateItem = useCallback(async (id: string, item: Partial<Item>) => {
    try {
      const updated = await apiClient.updateItem(id, {
        name: item.name,
        description: item.description,
        storageId: item.storageId,
        categoryId: item.categoryId,
        brand: item.brand,
        color: item.color,
        attributes: item.attributes,
        tagIds: item.tags,
        price: item.price,
        purchaseDate: item.purchaseDate,
        depreciationRate: item.depreciationRate,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold,
        maxThreshold: item.maxThreshold,
        rfid: item.rfid,
        barcode: item.barcode,
        images: item.images,
      });
      setItems(prev => prev.map(i => (i.id === id ? updated : i)));
      await refreshAlerts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新物品失败';
      setError(errorMessage);
      throw err;
    }
  }, [refreshAlerts]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await apiClient.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      await refreshAlerts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除物品失败';
      setError(errorMessage);
      throw err;
    }
  }, [refreshAlerts]);

  const getStoragePath = useCallback((storageId: string): string => {
    const storage = storages.find(s => s.id === storageId);
    if (!storage) return '';

    const room = rooms.find(r => r.id === storage.roomId);
    if (!room) return storage.name;

    const location = locations.find(l => l.id === room.locationId);
    if (!location) return `${room.name} / ${storage.name}`;

    return `${location.name} / ${room.name} / ${storage.name}`;
  }, [storages, rooms, locations]);

  // 分类操作
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await apiClient.createCategory({
        name: category.name,
        parentCategoryId: category.parentCategoryId,
        icon: category.icon,
        description: category.description,
        attributesTemplate: category.attributesTemplate,
      });
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建分类失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, category: Partial<Category>) => {
    try {
      const updated = await apiClient.updateCategory(id, {
        name: category.name,
        parentCategoryId: category.parentCategoryId,
        icon: category.icon,
        description: category.description,
        attributesTemplate: category.attributesTemplate,
      });
      setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新分类失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除分类失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const categoriesData = await apiClient.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to refresh categories:', err);
    }
  }, []);

  // 标签分组操作
  const addTagGroup = useCallback(async (tagGroup: Omit<TagGroup, 'id'>) => {
    try {
      const newTagGroup = await apiClient.createTagGroup({
        name: tagGroup.name,
        color: tagGroup.color,
        icon: tagGroup.icon,
        description: tagGroup.description,
      });
      setTagGroups(prev => [...prev, newTagGroup]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建标签分组失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTagGroup = useCallback(async (id: string, tagGroup: Partial<TagGroup>) => {
    try {
      const updated = await apiClient.updateTagGroup(id, {
        name: tagGroup.name,
        color: tagGroup.color,
        icon: tagGroup.icon,
        description: tagGroup.description,
      });
      setTagGroups(prev => prev.map(tg => (tg.id === id ? updated : tg)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新标签分组失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTagGroup = useCallback(async (id: string) => {
    try {
      await apiClient.deleteTagGroup(id);
      setTagGroups(prev => prev.filter(tg => tg.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除标签分组失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshTagGroups = useCallback(async () => {
    try {
      const tagGroupsData = await apiClient.getTagGroups();
      setTagGroups(tagGroupsData);
    } catch (err) {
      console.error('Failed to refresh tag groups:', err);
    }
  }, []);

  // 标签操作
  const addTag = useCallback(async (tag: Omit<Tag, 'id'>) => {
    try {
      const newTag = await apiClient.createTag({
        name: tag.name,
        tagGroupId: tag.tagGroupId,
        color: tag.color,
        icon: tag.icon,
      });
      setTags(prev => [...prev, newTag]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建标签失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTag = useCallback(async (id: string, tag: Partial<Tag>) => {
    try {
      const updated = await apiClient.updateTag(id, {
        name: tag.name,
        tagGroupId: tag.tagGroupId,
        color: tag.color,
        icon: tag.icon,
      });
      setTags(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新标签失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await apiClient.deleteTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除标签失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const tagsData = await apiClient.getTags();
      setTags(tagsData);
    } catch (err) {
      console.error('Failed to refresh tags:', err);
    }
  }, []);

  return (
    <StorageContext.Provider
      value={{
        locations,
        rooms,
        storages,
        items,
        alerts,
        categories,
        tagGroups,
        tags,
        selectedNode,
        loading,
        error,
        addLocation,
        updateLocation,
        deleteLocation,
        addRoom,
        updateRoom,
        deleteRoom,
        addStorage,
        updateStorage,
        deleteStorage,
        addItem,
        updateItem,
        deleteItem,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories,
        addTagGroup,
        updateTagGroup,
        deleteTagGroup,
        refreshTagGroups,
        addTag,
        updateTag,
        deleteTag,
        refreshTags,
        setSelectedNode,
        getStoragePath,
        refreshAlerts,
        refreshData,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
