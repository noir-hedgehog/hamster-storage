const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data.data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 地点 API
  async getLocations() {
    return this.request<any[]>('/locations');
  }

  async getLocation(id: string) {
    return this.request<any>(`/locations/${id}`);
  }

  async createLocation(data: { name: string; icon?: string }) {
    return this.request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: string, data: { name?: string; icon?: string; mapX?: number; mapY?: number }) {
    return this.request<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string) {
    return this.request<void>(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // 房间 API
  async getRooms(locationId?: string) {
    const query = locationId ? `?locationId=${locationId}` : '';
    return this.request<any[]>(`/rooms${query}`);
  }

  async getRoom(id: string) {
    return this.request<any>(`/rooms/${id}`);
  }

  async createRoom(data: { name: string; locationId: string; icon?: string }) {
    return this.request<any>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: string, data: { 
    name?: string; 
    icon?: string; 
    floorplanX?: number; 
    floorplanY?: number; 
    floorplanWidth?: number; 
    floorplanHeight?: number; 
    floorplanRotation?: number;
  }) {
    return this.request<any>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id: string) {
    return this.request<void>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // 收纳位置 API
  async getStorages(params?: { roomId?: string; parentStorageId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.roomId) queryParams.append('roomId', params.roomId);
    if (params?.parentStorageId) queryParams.append('parentStorageId', params.parentStorageId);
    
    const query = queryParams.toString();
    return this.request<any[]>(`/storages${query ? `?${query}` : ''}`);
  }

  async getStorage(id: string) {
    return this.request<any>(`/storages/${id}`);
  }

  async createStorage(data: {
    name: string;
    roomId: string;
    parentStorageId?: string;
    description?: string;
    icon?: string;
  }) {
    // 确保 undefined 值被转换为 null，以便正确传递到后端
    const payload: any = {
      name: data.name,
      roomId: data.roomId,
    };
    if (data.parentStorageId !== undefined) {
      payload.parentStorageId = data.parentStorageId || null;
    }
    if (data.description !== undefined) {
      payload.description = data.description || null;
    }
    if (data.icon !== undefined) {
      payload.icon = data.icon || null;
    }
    return this.request<any>('/storages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 分类 API
  async getCategories(parentCategoryId?: string | null) {
    const query = parentCategoryId !== undefined 
      ? `?parentCategoryId=${parentCategoryId === null ? 'null' : parentCategoryId}` 
      : '';
    return this.request<any[]>(`/categories${query}`);
  }

  async getCategory(id: string) {
    return this.request<any>(`/categories/${id}`);
  }

  async createCategory(data: {
    name: string;
    parentCategoryId?: string;
    icon?: string;
    description?: string;
    attributesTemplate?: Record<string, string>;
  }) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: {
    name?: string;
    parentCategoryId?: string;
    icon?: string;
    description?: string;
    attributesTemplate?: Record<string, string>;
  }) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // 标签分组 API
  async getTagGroups() {
    return this.request<any[]>('/tag-groups');
  }

  async getTagGroup(id: string) {
    return this.request<any>(`/tag-groups/${id}`);
  }

  async createTagGroup(data: {
    name: string;
    color?: string;
    icon?: string;
    description?: string;
  }) {
    return this.request<any>('/tag-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTagGroup(id: string, data: {
    name?: string;
    color?: string;
    icon?: string;
    description?: string;
  }) {
    return this.request<any>(`/tag-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTagGroup(id: string) {
    return this.request<void>(`/tag-groups/${id}`, {
      method: 'DELETE',
    });
  }

  // 标签 API
  async getTags(tagGroupId?: string | null) {
    const query = tagGroupId !== undefined 
      ? `?tagGroupId=${tagGroupId === null ? 'null' : tagGroupId}` 
      : '';
    return this.request<any[]>(`/tags${query}`);
  }

  async getTag(id: string) {
    return this.request<any>(`/tags/${id}`);
  }

  async createTag(data: {
    name: string;
    tagGroupId?: string;
    color?: string;
    icon?: string;
  }) {
    return this.request<any>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: string, data: {
    name?: string;
    tagGroupId?: string;
    color?: string;
    icon?: string;
  }) {
    return this.request<any>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string) {
    return this.request<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  async updateStorage(
    id: string,
    data: {
      name?: string;
      parentStorageId?: string;
      description?: string;
      icon?: string;
      floorplanX?: number;
      floorplanY?: number;
      floorplanWidth?: number;
      floorplanHeight?: number;
      floorplanRotation?: number;
    }
  ) {
    return this.request<any>(`/storages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStorage(id: string) {
    return this.request<void>(`/storages/${id}`, {
      method: 'DELETE',
    });
  }

  // 物品 API
  async getItems(params?: {
    storageId?: string;
    search?: string;
    categoryId?: string;
    tagId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.storageId) queryParams.append('storageId', params.storageId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.tagId) queryParams.append('tagId', params.tagId);
    
    const query = queryParams.toString();
    return this.request<any[]>(`/items${query ? `?${query}` : ''}`);
  }

  async getItem(id: string) {
    return this.request<any>(`/items/${id}`);
  }

  async getItemByRfid(rfid: string) {
    return this.request<any>(`/items/rfid/${rfid}`);
  }

  async createItem(data: any) {
    return this.request<any>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: string, data: any) {
    return this.request<any>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string) {
    return this.request<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteItems(ids: string[]) {
    return this.request<void>('/items/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // 提醒 API
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  // 统计 API
  async getDashboardStats() {
    return this.request<any>('/stats/dashboard');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
