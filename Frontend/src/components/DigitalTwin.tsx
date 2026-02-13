import React, { useState, useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { X, Eye, Package, MapPin, Layers, BarChart3 } from 'lucide-react';

interface DigitalTwinProps {
  onClose: () => void;
}

export function DigitalTwin({ onClose }: DigitalTwinProps) {
  const { locations, rooms, storages, items, getStoragePath } = useStorage();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      locations: locations.length,
      rooms: rooms.length,
      storages: storages.length,
      items: items.length,
      totalQuantity: totalItems,
      totalValue,
    };
  }, [locations, rooms, storages, items]);

  const getLocationStats = (locationId: string) => {
    const locationRooms = rooms.filter(r => r.locationId === locationId);
    const roomIds = locationRooms.map(r => r.id);
    const locationStorages = storages.filter(s => roomIds.includes(s.roomId));
    const storageIds = locationStorages.map(s => s.id);
    const locationItems = items.filter(item => storageIds.includes(item.storageId));

    return {
      rooms: locationRooms.length,
      storages: locationStorages.length,
      items: locationItems.length,
      quantity: locationItems.reduce((sum, item) => sum + item.quantity, 0),
      value: locationItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    };
  };

  const getRoomStats = (roomId: string) => {
    const roomStorages = storages.filter(s => s.roomId === roomId);
    const storageIds = roomStorages.map(s => s.id);
    const roomItems = items.filter(item => storageIds.includes(item.storageId));

    return {
      storages: roomStorages.length,
      items: roomItems.length,
      quantity: roomItems.reduce((sum, item) => sum + item.quantity, 0),
      value: roomItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    };
  };

  const getStorageStats = (storageId: string) => {
    const storageItems = items.filter(item => item.storageId === storageId);

    return {
      items: storageItems.length,
      quantity: storageItems.reduce((sum, item) => sum + item.quantity, 0),
      value: storageItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    };
  };

  const filteredRooms = selectedLocation
    ? rooms.filter(r => r.locationId === selectedLocation)
    : [];

  const filteredStorages = selectedRoom
    ? storages.filter(s => s.roomId === selectedRoom)
    : [];

  const filteredItems = selectedStorage
    ? items.filter(item => item.storageId === selectedStorage)
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="w-6 h-6 text-mint-600" />
                数字孪生视图
              </h2>
              <p className="text-sm text-gray-500 mt-1">可视化查看所有储物空间和物品分布</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 总体统计 */}
          <div className="grid grid-cols-6 gap-4 mt-6">
            <div className="bg-mint-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-mint-600">{stats.locations}</p>
              <p className="text-xs text-gray-600 mt-1">地点</p>
            </div>
            <div className="bg-mint-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-mint-600">{stats.rooms}</p>
              <p className="text-xs text-gray-600 mt-1">房间</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.storages}</p>
              <p className="text-xs text-gray-600 mt-1">收纳位</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.items}</p>
              <p className="text-xs text-gray-600 mt-1">物品种类</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-pink-600">{stats.totalQuantity}</p>
              <p className="text-xs text-gray-600 mt-1">总数量</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">¥{stats.totalValue.toFixed(0)}</p>
              <p className="text-xs text-gray-600 mt-1">总价值</p>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 地点列表 */}
          <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-700">地点</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {locations.map(location => {
                const locationStats = getLocationStats(location.id);
                const isSelected = selectedLocation === location.id;

                return (
                  <div
                    key={location.id}
                    onClick={() => {
                      setSelectedLocation(location.id);
                      setSelectedRoom(null);
                      setSelectedStorage(null);
                    }}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-mint-50 border-l-4 border-mint-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{location.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>房间: {locationStats.rooms}</div>
                      <div>收纳: {locationStats.storages}</div>
                      <div>物品: {locationStats.items}</div>
                      <div>¥{locationStats.value.toFixed(0)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 房间列表 */}
          <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-700">房间</h3>
            </div>
            {selectedLocation ? (
              <div className="divide-y divide-gray-200">
                {filteredRooms.map(room => {
                  const roomStats = getRoomStats(room.id);
                  const isSelected = selectedRoom === room.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room.id);
                        setSelectedStorage(null);
                      }}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-mint-50 border-l-4 border-mint-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{room.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>收纳: {roomStats.storages}</div>
                        <div>物品: {roomStats.items}</div>
                        <div className="col-span-2">¥{roomStats.value.toFixed(0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                选择一个地点查看房间
              </div>
            )}
          </div>

          {/* 收纳位置列表 */}
          <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-700">收纳位置</h3>
            </div>
            {selectedRoom ? (
              <div className="divide-y divide-gray-200">
                {filteredStorages.map(storage => {
                  const storageStats = getStorageStats(storage.id);
                  const isSelected = selectedStorage === storage.id;

                  return (
                    <div
                      key={storage.id}
                      onClick={() => setSelectedStorage(storage.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-mint-50 border-l-4 border-mint-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{storage.name}</h4>
                      {storage.description && (
                        <p className="text-xs text-gray-500 mb-2">{storage.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>物品: {storageStats.items}</div>
                        <div>数量: {storageStats.quantity}</div>
                        <div className="col-span-2">¥{storageStats.value.toFixed(0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                选择一个房间查看收纳位置
              </div>
            )}
          </div>

          {/* 物品列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-700">物品详情</h3>
            </div>
            {selectedStorage ? (
              <div className="p-4 space-y-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <span className="text-sm text-gray-500">
                          {item.quantity} {item.unit || '件'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.brand && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {item.brand}
                          </span>
                        )}
                        {item.category && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {item.category}
                          </span>
                        )}
                        {item.price && (
                          <span className="px-2 py-1 bg-mint-100 text-mint-700 rounded">
                            ¥{item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-mint-100 text-mint-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    该收纳位置暂无物品
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <Eye className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-1">选择收纳位置</p>
                <p className="text-sm">查看其中的物品详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
