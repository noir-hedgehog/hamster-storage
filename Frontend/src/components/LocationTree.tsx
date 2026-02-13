import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import {
  Home,
  Plus,
  ChevronRight,
  ChevronDown,
  DoorOpen,
  Archive,
  X,
  Layers,
} from 'lucide-react';

interface LocationTreeProps {
  onClose?: () => void;
  onSwitchToVisual?: () => void;
}

export function LocationTree({ onClose, onSwitchToVisual }: LocationTreeProps) {
  const {
    locations,
    rooms,
    storages,
    items,
    selectedNode,
    setSelectedNode,
  } = useStorage();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getItemCount = (nodeType: string, nodeId: string): number => {
    if (nodeType === 'storage') {
      return items.filter(item => item.storageId === nodeId).length;
    } else if (nodeType === 'room') {
      const roomStorages = storages.filter(s => s.roomId === nodeId && !s.parentStorageId);
      return items.filter(item => roomStorages.some(s => s.id === item.storageId)).length;
    } else if (nodeType === 'location') {
      const locationRooms = rooms.filter(r => r.locationId === nodeId);
      const roomIds = locationRooms.map(r => r.id);
      const locationStorages = storages.filter(s => roomIds.includes(s.roomId) && !s.parentStorageId);
      return items.filter(item => locationStorages.some(s => s.id === item.storageId)).length;
    }
    return 0;
  };

  const renderStorage = (storage: any, level: number = 0) => {
    const childStorages = storages.filter(s => s.parentStorageId === storage.id);
    const storageItemCount = getItemCount('storage', storage.id);
    const isExpanded = expandedNodes.has(storage.id);

    return (
      <div key={storage.id} className="mb-1">
        <div
          className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer btn-mint-ghost transition-colors group ${
            selectedNode?.type === 'storage' && selectedNode?.id === storage.id
              ? 'bg-mint-50 text-mint-700'
              : ''
          }`}
          style={{ paddingLeft: `${0.5 + level * 1}rem` }}
          onClick={() => {
            setSelectedNode({ type: 'storage', id: storage.id });
            toggleNode(storage.id);
            onClose?.();
          }}
        >
          {childStorages.length > 0 ? (
            <button onClick={e => { e.stopPropagation(); toggleNode(storage.id); }} className="p-0.5">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <Archive className="w-4 h-4" />
          <span className="flex-1 text-sm">{storage.name}</span>
          <span className="text-xs text-gray-500">{storageItemCount}</span>
          <button
            onClick={e => {
              e.stopPropagation();
              setSelectedNode({ type: 'storage', id: storage.id });
              // 触发添加子收纳
              window.dispatchEvent(new CustomEvent('openAddStorageModal', { 
                detail: { roomId: storage.roomId, parentStorageId: storage.id } 
              }));
            }}
            className="p-1 hover:bg-gray-200 rounded transition-opacity opacity-70 hover:opacity-100"
            title="添加子收纳"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {isExpanded && childStorages.length > 0 && (
          <div className="mt-1">
            {childStorages.map(child => renderStorage(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col glass">
      {/* 头部 */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-lg sm:text-xl text-gray-900">储物空间</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">管理地点、房间和收纳位置</p>
          </div>
          <div className="flex items-center gap-2">
            {onSwitchToVisual && (
              <button
                onClick={onSwitchToVisual}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="可视化视图"
              >
                <Layers className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openAddLocationModal'));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="添加地点"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 树状列表 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {locations.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-400">
            <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">还没有添加地点</p>
            <p className="text-xs mt-1">点击右上角 + 开始创建</p>
          </div>
        ) : (
          locations.map(location => {
            const locationRooms = rooms.filter(r => r.locationId === location.id);
            const isExpanded = expandedNodes.has(location.id);
            const itemCount = getItemCount('location', location.id);

            return (
              <div key={location.id} className="mb-1">
                {/* 地点 */}
                <div
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer btn-mint-ghost transition-colors group ${
                    selectedNode?.type === 'location' && selectedNode?.id === location.id
                      ? 'bg-mint-50 text-mint-700'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedNode({ type: 'location', id: location.id });
                    toggleNode(location.id);
                    onClose?.();
                  }}
                >
                  <button onClick={e => { e.stopPropagation(); toggleNode(location.id); }} className="p-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <Home className="w-4 h-4" />
                  <span className="flex-1 text-sm font-medium">{location.name}</span>
                  <span className="text-xs text-gray-500">{itemCount}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedNode({ type: 'location', id: location.id });
                      window.dispatchEvent(new CustomEvent('openAddRoomModal', { 
                        detail: { locationId: location.id } 
                      }));
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-opacity opacity-70 group-hover:opacity-100"
                    title="添加房间"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 房间 */}
                {isExpanded && (
                  <div className="ml-4 mt-1">
                    {locationRooms.map(room => {
                      const roomStorages = storages.filter(s => s.roomId === room.id && !s.parentStorageId);
                      const isRoomExpanded = expandedNodes.has(room.id);
                      const roomItemCount = getItemCount('room', room.id);

                      return (
                        <div key={room.id} className="mb-1">
                          {/* 房间节点 */}
                          <div
                            className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer btn-mint-ghost transition-colors group ${
                              selectedNode?.type === 'room' && selectedNode?.id === room.id
                                ? 'bg-mint-50 text-mint-700'
                                : ''
                            }`}
                            onClick={() => {
                              setSelectedNode({ type: 'room', id: room.id });
                              toggleNode(room.id);
                              onClose?.();
                            }}
                          >
                            <button onClick={e => { e.stopPropagation(); toggleNode(room.id); }} className="p-0.5">
                              {isRoomExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            <DoorOpen className="w-4 h-4" />
                            <span className="flex-1 text-sm">{room.name}</span>
                            <span className="text-xs text-gray-500">{roomItemCount}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedNode({ type: 'room', id: room.id });
                                window.dispatchEvent(new CustomEvent('openAddStorageModal', { 
                                  detail: { roomId: room.id } 
                                }));
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-opacity opacity-70 group-hover:opacity-100"
                              title="添加收纳位置"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 收纳位置（只显示顶级收纳，子收纳通过renderStorage递归显示） */}
                          {isRoomExpanded && (
                            <div className="ml-4 mt-1">
                              {roomStorages.map(storage => renderStorage(storage, 0))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
