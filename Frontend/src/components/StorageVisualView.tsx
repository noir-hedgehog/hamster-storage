import React, { useState, useRef, useEffect } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { MapPin, Home, Box, Layers, Grid, Maximize2, Minimize2, Plus, X, Save, RotateCcw, Info, Eye, EyeOff, ZoomIn, ZoomOut, RefreshCw, Package, ChevronRight, ChevronDown, Archive, BookOpen, Search, DoorOpen, Compass, Target, Camera, Square } from 'lucide-react';
import * as THREE from 'three';

type VisualViewMode = 'map' | 'floorplan' | '3d';

interface LocationPosition {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface RoomLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface StorageVisualViewProps {
  onClose?: () => void;
}

// 根据收纳类型创建3D模型
function createStorageModel(
  type: string,
  size: { width: number; height: number; depth: number },
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const { width, height, depth } = size;

  // 根据类型创建不同的模型
  switch (type) {
    case '衣柜':
    case '📁': {
      // 主盒子
      const mainBox = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 })
      );
      mainBox.position.y = height / 2;
      group.add(mainBox);

      // 顶部装饰线
      const topLine = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.02, height * 0.05, depth * 1.02),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.3 })
      );
      topLine.position.y = height;
      group.add(topLine);

      // 门框线（垂直）
      const doorFrame1 = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.02, height * 0.9, depth * 1.01),
        new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.3 })
      );
      doorFrame1.position.set(-width * 0.25, height * 0.45, depth * 0.505);
      group.add(doorFrame1);

      const doorFrame2 = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.02, height * 0.9, depth * 1.01),
        new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.3 })
      );
      doorFrame2.position.set(width * 0.25, height * 0.45, depth * 0.505);
      group.add(doorFrame2);
      break;
    }

    case '抽屉':
    case '📦': {
      // 多个抽屉堆叠
      const drawerCount = 3;
      const drawerHeight = height / drawerCount;
      const drawerDepth = depth * 0.9;

      for (let i = 0; i < drawerCount; i++) {
        // 抽屉盒子
        const drawer = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.95, drawerHeight * 0.9, drawerDepth),
          new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.5 })
        );
        drawer.position.set(0, i * drawerHeight + drawerHeight / 2, 0);
        group.add(drawer);

        // 拉手（小圆柱）
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.set(width * 0.4, i * drawerHeight + drawerHeight / 2, drawerDepth / 2 + 0.01);
        group.add(handle);
      }

      // 外框
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.3 })
      );
      frame.position.y = height / 2;
      group.add(frame);
      break;
    }

    case '书架':
    case '📚': {
      // 主框架
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.1, roughness: 0.8 })
      );
      frame.position.y = height / 2;
      group.add(frame);

      // 垂直板（薄盒子）
      const shelfCount = 4;
      const shelfWidth = width / (shelfCount + 1);
      for (let i = 1; i <= shelfCount; i++) {
        const verticalBoard = new THREE.Mesh(
          new THREE.BoxGeometry(shelfWidth * 0.1, height, depth * 0.9),
          new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.1, roughness: 0.8 })
        );
        verticalBoard.position.set(
          (i / (shelfCount + 1) - 0.5) * width,
          height / 2,
          0
        );
        group.add(verticalBoard);
      }

      // 水平隔板
      const horizontalShelfCount = 3;
      const shelfHeight = height / (horizontalShelfCount + 1);
      for (let i = 1; i <= horizontalShelfCount; i++) {
        const horizontalShelf = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.9, shelfHeight * 0.1, depth * 0.9),
          new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.1, roughness: 0.8 })
        );
        horizontalShelf.position.set(0, i * shelfHeight, 0);
        group.add(horizontalShelf);
      }
      break;
    }

    case '储物箱':
    case '📦': {
      // 主盒子
      const mainBox = new THREE.Mesh(
        new THREE.BoxGeometry(width, height * 0.85, depth),
        new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6 })
      );
      mainBox.position.y = height * 0.425;
      group.add(mainBox);

      // 盖子（稍微打开）
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.98, height * 0.15, depth * 0.98),
        new THREE.MeshStandardMaterial({ color: color * 0.9, metalness: 0.2, roughness: 0.6 })
      );
      lid.position.set(0, height * 0.85, -depth * 0.1);
      lid.rotation.x = -0.2; // 稍微打开
      group.add(lid);
      break;
    }

    case '鞋柜':
    case '👟': {
      // 主框架
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.1, roughness: 0.8 })
      );
      frame.position.y = height / 2;
      group.add(frame);

      // 多层水平隔板
      const shelfCount = 4;
      const shelfHeight = height / (shelfCount + 1);
      for (let i = 1; i <= shelfCount; i++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.9, shelfHeight * 0.1, depth * 0.9),
          new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.1, roughness: 0.8 })
        );
        shelf.position.set(0, i * shelfHeight, 0);
        group.add(shelf);
      }
      break;
    }

    default: {
      // 默认：简单盒子
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 })
      );
      box.position.y = height / 2;
      group.add(box);
      break;
    }
  }

  return group;
}

export function StorageVisualView({ onClose }: StorageVisualViewProps) {
  const { locations, rooms, storages, items, updateLocation, updateRoom, updateStorage, addStorage, addRoom, deleteRoom, categories } = useStorage();
  const [viewMode, setViewMode] = useState<VisualViewMode>('map');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationPositions, setLocationPositions] = useState<Map<string, LocationPosition>>(new Map());
  const [roomLayouts, setRoomLayouts] = useState<Map<string, RoomLayout[]>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'location' | 'room'; id: string } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<{ roomId: string; handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedStorage3D, setSelectedStorage3D] = useState<string | null>(null);
  const [hoveredStorage3D, setHoveredStorage3D] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(new Set());
  const [showStorageLibrary, setShowStorageLibrary] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'items' | 'details'>('items');
  const [isEditing3D, setIsEditing3D] = useState(false);
  const [draggingStorage3D, setDraggingStorage3D] = useState<{ id: string; startPos: THREE.Vector3 } | null>(null);
  const [resizingStorage3D, setResizingStorage3D] = useState<{ id: string; handle: string; startSize: { width: number; height: number }; startPos: THREE.Vector3 } | null>(null);
  const [draggingTemplate, setDraggingTemplate] = useState<{ template: { name: string; icon: string; description: string }; previewMesh: THREE.Group | null } | null>(null);
  const [selectedStorageForEdit, setSelectedStorageForEdit] = useState<string | null>(null);
  const [cameraViewMode, setCameraViewMode] = useState<'isometric' | 'top' | 'front' | 'side'>('isometric');
  const [showGrid, setShowGrid] = useState(true);
  const [showRoomBorders, setShowRoomBorders] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const floorplanCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);

  // 从后端加载地点位置
  useEffect(() => {
    if (viewMode === 'map' && locations.length > 0) {
      const newPositions = new Map(locationPositions);
      locations.forEach((location, index) => {
        if (!newPositions.has(location.id)) {
          // 优先使用保存的位置，否则使用默认位置
          if (location.mapX !== undefined && location.mapY !== undefined) {
            newPositions.set(location.id, {
              id: location.id,
              x: location.mapX,
              y: location.mapY,
              name: location.name,
            });
          } else {
            // 默认位置：圆形排列
            const angle = (index / locations.length) * 2 * Math.PI;
            const radius = 150;
            newPositions.set(location.id, {
              id: location.id,
              x: 400 + radius * Math.cos(angle),
              y: 300 + radius * Math.sin(angle),
              name: location.name,
            });
          }
        }
      });
      setLocationPositions(newPositions);
    }
  }, [locations, viewMode]);

  // 从后端加载房间布局
  useEffect(() => {
    if (viewMode === 'floorplan' && selectedLocation && rooms.length > 0) {
      const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
      const layouts: RoomLayout[] = [];
      
      locationRooms.forEach((room) => {
        if (room.floorplanX !== undefined && room.floorplanY !== undefined) {
          layouts.push({
            id: room.id,
            x: room.floorplanX,
            y: room.floorplanY,
            width: room.floorplanWidth || 180,
            height: room.floorplanHeight || 120,
            rotation: room.floorplanRotation || 0,
          });
        } else {
          // 默认布局
          const index = locationRooms.indexOf(room);
          layouts.push({
            id: room.id,
            x: 100 + (index % 3) * 200,
            y: 100 + Math.floor(index / 3) * 150,
            width: 180,
            height: 120,
            rotation: 0,
          });
        }
      });
      
      // 更新房间布局，但保留已有的编辑（如果正在编辑）
      setRoomLayouts(prev => {
        const newLayouts = new Map(prev);
        const existingLayouts = newLayouts.get(selectedLocation) || [];
        const existingIds = new Set(existingLayouts.map(l => l.id));
        
        // 添加新房间的布局
        const newRooms = layouts.filter(l => !existingIds.has(l.id));
        if (newRooms.length > 0 || existingLayouts.length === 0) {
          // 合并现有布局和新布局，保留已编辑的位置
          const mergedLayouts = [...existingLayouts];
          newRooms.forEach(newLayout => {
            mergedLayouts.push(newLayout);
          });
          // 移除已删除的房间
          const validIds = new Set(locationRooms.map(r => r.id));
          const filteredLayouts = mergedLayouts.filter(l => validIds.has(l.id));
          newLayouts.set(selectedLocation, filteredLayouts);
        } else {
          // 即使没有新房间，也要移除已删除的房间
          const validIds = new Set(locationRooms.map(r => r.id));
          const filteredLayouts = existingLayouts.filter(l => validIds.has(l.id));
          if (filteredLayouts.length !== existingLayouts.length) {
            newLayouts.set(selectedLocation, filteredLayouts);
          }
        }
        return newLayouts;
      });
    }
  }, [viewMode, selectedLocation, rooms]);

  // 初始化3D场景
  useEffect(() => {
    if (viewMode !== '3d' || !threeContainerRef.current || !selectedLocation) return;

    const container = threeContainerRef.current;
    if (!container) return;
    
    // 存储场景、相机、渲染器等引用，以便在编辑模式下使用
    let sceneRef: THREE.Scene;
    let cameraRef: THREE.PerspectiveCamera;
    let rendererRef: THREE.WebGLRenderer;
    let controlsRef: any = null;
    let storageMeshes: Map<string, THREE.Mesh> = new Map();
    let animationId: number | null = null;
    
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef = renderer;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 添加网格地面（可控制显示/隐藏）
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    
    // 添加坐标轴辅助器（可选）
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);

    // 获取该地点的房间和收纳位置
    const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
    const currentLayouts = roomLayouts.get(selectedLocation) || [];

      // 为每个房间创建容器组
      locationRooms.forEach((room, roomIndex) => {
        // 标记房间组，方便后续查找
        const roomGroup = new THREE.Group();
        (roomGroup as any).userData = { roomId: room.id };
      // 优先使用保存的布局数据，否则使用默认值
      let roomLayout = currentLayouts.find(l => l.id === room.id);
      if (!roomLayout && (room.floorplanX !== undefined && room.floorplanY !== undefined)) {
        roomLayout = {
          id: room.id,
          x: room.floorplanX,
          y: room.floorplanY,
          width: room.floorplanWidth || 180,
          height: room.floorplanHeight || 120,
          rotation: room.floorplanRotation || 0,
        };
      }
      if (!roomLayout) {
        // 使用默认布局
        roomLayout = {
          id: room.id,
          x: 100 + (roomIndex % 3) * 200,
          y: 100 + Math.floor(roomIndex / 3) * 150,
          width: 180,
          height: 120,
          rotation: 0,
        };
      }

      // 房间位置（从平面图坐标转换为3D坐标）
      // 假设平面图的1单位 = 3D的0.1单位
      const roomX = (roomLayout.x - 400) * 0.01; // 中心化
      const roomZ = (roomLayout.y - 300) * 0.01;
      roomGroup.position.set(roomX, 0, roomZ);

      // 创建房间地板（半透明）
      const floorGeometry = new THREE.PlaneGeometry(
        roomLayout.width * 0.01,
        roomLayout.height * 0.01
      );
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      roomGroup.add(floor);

      // 创建房间边框（线框，可控制显示/隐藏）
      const roomEdges = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          roomLayout.width * 0.01,
          0.1,
          roomLayout.height * 0.01
        )
      );
      const roomLine = new THREE.LineSegments(
        roomEdges,
        new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 })
      );
      roomLine.position.y = 0.05;
      roomLine.visible = showRoomBorders;
      (roomLine as any).userData = { isRoomBorder: true };
      roomGroup.add(roomLine);

      // 获取该房间的收纳位置
      const roomStorages = storages.filter(
        s => s.roomId === room.id && !s.parentStorageId
      );

      // 为每个收纳位置创建盒子
      roomStorages.forEach((storage, storageIndex) => {
        // 如果有平面图布局数据，使用它；否则使用默认位置
        const storageX = storage.floorplanX !== undefined
          ? (storage.floorplanX - roomLayout.x) * 0.01
          : (storageIndex % 4) * 0.3 - 0.45;
        const storageZ = storage.floorplanY !== undefined
          ? (storage.floorplanY - roomLayout.y) * 0.01
          : Math.floor(storageIndex / 4) * 0.3 - 0.3;

        // 使用平面图的尺寸，如果没有则使用默认值
        const storageWidth = storage.floorplanWidth 
          ? storage.floorplanWidth * 0.01 
          : 0.2;
        const storageHeight = storage.floorplanHeight 
          ? storage.floorplanHeight * 0.01 
          : 0.2;
        
        // 根据物品数量调整盒子高度
        const storageItems = items.filter(item => item.storageId === storage.id);
        const itemCount = storageItems.reduce((sum, item) => sum + item.quantity, 0);
        const maxItemCount = Math.max(1, ...storages.map(s => 
          items.filter(item => item.storageId === s.id).reduce((sum, item) => sum + item.quantity, 0)
        ));
        // 基础高度 + 根据物品数量增加的高度（最多增加50%）
        const baseDepth = 0.15;
        const storageDepth = baseDepth + (itemCount / maxItemCount) * baseDepth * 0.5;

        // 根据物品数量调整颜色（从绿色到橙色到红色）
        let storageColor = 0x10b981; // 绿色（空）
        if (itemCount > 0) {
          const fullness = itemCount / Math.max(10, maxItemCount);
          if (fullness < 0.3) {
            storageColor = 0x10b981; // 绿色（少）
          } else if (fullness < 0.7) {
            storageColor = 0xf59e0b; // 橙色（中等）
          } else {
            storageColor = 0xef4444; // 红色（多）
          }
        }

        // 使用模型生成函数创建收纳模型
        const storageType = storage.icon || storage.name;
        const storageModel = createStorageModel(
          storageType,
          { width: storageWidth, height: storageDepth, depth: storageHeight },
          storageColor
        );
        storageModel.position.set(storageX, 0, storageZ);
        
        // 设置阴影
        storageModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // 存储收纳ID到group，用于点击检测
        (storageModel as any).userData = { storageId: storage.id, itemCount, originalStorage: storage };
        storageMeshes.set(storage.id, storageModel as any);
        roomGroup.add(storageModel);

        // 添加高亮边框（默认隐藏）- 使用包围盒创建边框
        const box = new THREE.Box3().setFromObject(storageModel);
        const boxSize = box.getSize(new THREE.Vector3());
        const boxCenter = box.getCenter(new THREE.Vector3());
        const highlightGeometry = new THREE.BoxGeometry(boxSize.x * 1.02, boxSize.y * 1.02, boxSize.z * 1.02);
        const highlightEdges = new THREE.EdgesGeometry(highlightGeometry);
        const highlightLine = new THREE.LineSegments(
          highlightEdges,
          new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
        );
        highlightLine.position.copy(boxCenter);
        highlightLine.visible = false;
        (highlightLine as any).userData = { storageId: storage.id, isHighlight: true };
        roomGroup.add(highlightLine);

        // 应用旋转角度
        if (storage.floorplanRotation) {
          storageModel.rotation.y = (storage.floorplanRotation * Math.PI) / 180;
        }

        // 添加收纳名称标签（使用Sprite）
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = 256;
          canvas.height = 80;
          context.fillStyle = 'rgba(0, 0, 0, 0.8)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = '#ffffff';
          context.font = 'bold 20px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(
            storage.name.length > 12 ? storage.name.substring(0, 12) + '...' : storage.name,
            canvas.width / 2,
            canvas.height / 2 - 10
          );
          // 显示物品数量
          if (itemCount > 0) {
            context.fillStyle = '#10b981';
            context.font = '16px Arial';
            context.fillText(
              `${itemCount} 件`,
              canvas.width / 2,
              canvas.height / 2 + 10
            );
          }

          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
          const sprite = new THREE.Sprite(spriteMaterial);
          // 使用模型的实际高度来定位标签
          const box = new THREE.Box3().setFromObject(storageModel);
          const boxSize = box.getSize(new THREE.Vector3());
          sprite.position.set(storageX, boxSize.y + 0.15, storageZ);
          sprite.scale.set(0.6, 0.15, 1);
          sprite.visible = showLabels;
          (sprite as any).userData = { storageId: storage.id, isLabel: true };
          roomGroup.add(sprite);
        }
      });

      // 添加房间名称标签
      const roomCanvas = document.createElement('canvas');
      const roomContext = roomCanvas.getContext('2d');
      if (roomContext) {
        roomCanvas.width = 256;
        roomCanvas.height = 64;
        roomContext.fillStyle = 'rgba(59, 130, 246, 0.8)';
        roomContext.fillRect(0, 0, roomCanvas.width, roomCanvas.height);
        roomContext.fillStyle = '#ffffff';
        roomContext.font = 'bold 24px Arial';
        roomContext.textAlign = 'center';
        roomContext.textBaseline = 'middle';
        roomContext.fillText(room.name, roomCanvas.width / 2, roomCanvas.height / 2);

        const roomTexture = new THREE.CanvasTexture(roomCanvas);
        const roomSpriteMaterial = new THREE.SpriteMaterial({ map: roomTexture });
        const roomSprite = new THREE.Sprite(roomSpriteMaterial);
        roomSprite.position.set(0, 0.3, 0);
        roomSprite.scale.set(1, 0.25, 1);
        roomSprite.visible = showLabels;
        roomGroup.add(roomSprite);
      }

      scene.add(roomGroup);
    });

    // 射线投射器（用于点击检测）
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 拖拽平面（水平面，y=0）
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dragIntersection = new THREE.Vector3();
    let draggingRoomGroup: THREE.Group | null = null;
    let previewMesh: THREE.Group | null = null;

    // 点击事件处理
    const onStorageClick = (event: MouseEvent) => {
      if (!container) return;
      
      // 如果正在从收纳库拖拽模板，释放时创建收纳
      if (isEditing3D && draggingTemplate && previewMesh) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(dragPlane, dragIntersection);

        // 查找放置位置所在的房间
        let targetRoom: typeof rooms[0] | null = null;
        let targetRoomGroup: THREE.Group | null = null;
        
        scene.children.forEach((child: any) => {
          if (child.userData?.roomId) {
            const room = rooms.find(r => r.id === child.userData.roomId);
            if (room) {
              const roomGroup = child as THREE.Group;
              const roomLayout = roomLayouts.get(selectedLocation || '')?.find(l => l.id === room.id);
              if (roomLayout) {
                const roomX = (roomLayout.x - 400) * 0.01;
                const roomZ = (roomLayout.y - 300) * 0.01;
                const roomWidth = roomLayout.width * 0.01;
                const roomHeight = roomLayout.height * 0.01;
                
                const localX = dragIntersection.x - roomX;
                const localZ = dragIntersection.z - roomZ;
                if (Math.abs(localX) < roomWidth / 2 && Math.abs(localZ) < roomHeight / 2) {
                  targetRoom = room;
                  targetRoomGroup = roomGroup;
                }
              }
            }
          }
        });

        if (targetRoom && targetRoomGroup) {
          // 计算平面图坐标
          const localPos = dragIntersection.clone();
          localPos.sub(targetRoomGroup.position);
          const floorplanX = (localPos.x / 0.01) + (targetRoom.floorplanX || 400);
          const floorplanY = (localPos.z / 0.01) + (targetRoom.floorplanY || 300);

          // 创建收纳
          addStorage({
            name: draggingTemplate.template.name,
            roomId: targetRoom.id,
            description: draggingTemplate.template.description,
            icon: draggingTemplate.template.icon,
            floorplanX,
            floorplanY,
            floorplanWidth: 20, // 默认尺寸
            floorplanHeight: 20,
          }).catch(err => {
            console.error('创建收纳失败:', err);
            alert('创建收纳失败');
          });
        }

        // 清理预览
        if (previewMesh) {
          scene.remove(previewMesh);
          previewMesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          previewMesh = null;
        }
        setDraggingTemplate(null);
        return;
      }
      
      if (isEditing3D && draggingStorage3D) {
        // 编辑模式下，如果正在拖拽，则结束拖拽并保存
        const draggingStorage = draggingStorage3D;
        const storageMesh = storageMeshes.get(draggingStorage.id);
        if (storageMesh) {
          // 找到收纳所属的房间
          const storage = storages.find(s => s.id === draggingStorage.id);
          if (storage) {
            const room = rooms.find(r => r.id === storage.roomId);
            if (room) {
              // 获取房间组的位置
              const roomGroup = scene.children.find((child: any) => 
                child.userData?.roomId === room.id
              ) as THREE.Group;
              
              if (roomGroup) {
                // 计算相对于房间的局部坐标
                const worldPos = storageMesh.position.clone();
                const localPos = new THREE.Vector3();
                localPos.copy(worldPos);
                localPos.sub(roomGroup.position);
                
                // 转换为平面图坐标（反向转换）
                const floorplanX = (localPos.x / 0.01) + (room.floorplanX || 400);
                const floorplanY = (localPos.z / 0.01) + (room.floorplanY || 300);
                
                // 保存位置
                updateStorage(draggingStorage.id, {
                  floorplanX,
                  floorplanY,
                }).catch(err => {
                  console.error('保存收纳位置失败:', err);
                });
              }
            }
          }
        }
        setDraggingStorage3D(null);
        draggingRoomGroup = null;
        return;
      }
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const intersect of intersects) {
        const object = intersect.object as any;
        // 检查是否是收纳模型或其子对象
        let storageId: string | null = null;
        if (object.userData?.storageId && !object.userData?.isLabel) {
          storageId = object.userData.storageId;
        } else if (object.parent && (object.parent as any).userData?.storageId) {
          storageId = (object.parent as any).userData.storageId;
        }
        
        if (storageId) {
          if (isEditing3D) {
            // 编辑模式下，选中收纳或开始拖拽
            setSelectedStorageForEdit(storageId);
            // 如果按住Shift键，开始拖拽
            if (event.shiftKey) {
              const storageMesh = storageMeshes.get(storageId);
              if (storageMesh) {
                // 找到收纳所属的房间组
                const storage = storages.find(s => s.id === storageId);
                if (storage) {
                  const room = rooms.find(r => r.id === storage.roomId);
                  if (room) {
                    draggingRoomGroup = scene.children.find((child: any) => 
                      child.userData?.roomId === room.id
                    ) as THREE.Group || null;
                  }
                }
                
                setDraggingStorage3D({
                  id: storageId,
                  startPos: storageMesh.position.clone(),
                });
              }
            }
          } else {
            setSelectedStorage3D(storageId);
          }
          break;
        }
      }
    };

    // 悬停事件处理
    const onStorageHover = (event: MouseEvent) => {
      if (!container) return;
      
      // 如果正在从收纳库拖拽模板
      if (isEditing3D && draggingTemplate && selectedLocation) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(dragPlane, dragIntersection);

        // 查找鼠标位置所在的房间
        let targetRoom: typeof rooms[0] | null = null;
        let targetRoomGroup: THREE.Group | null = null;
        
        scene.children.forEach((child: any) => {
          if (child.userData?.roomId) {
            const room = rooms.find(r => r.id === child.userData.roomId);
            if (room) {
              const roomGroup = child as THREE.Group;
              const roomLayout = roomLayouts.get(selectedLocation)?.find(l => l.id === room.id);
              if (roomLayout) {
                const roomX = (roomLayout.x - 400) * 0.01;
                const roomZ = (roomLayout.y - 300) * 0.01;
                const roomWidth = roomLayout.width * 0.01;
                const roomHeight = roomLayout.height * 0.01;
                
                // 检查是否在房间范围内
                const localX = dragIntersection.x - roomX;
                const localZ = dragIntersection.z - roomZ;
                if (Math.abs(localX) < roomWidth / 2 && Math.abs(localZ) < roomHeight / 2) {
                  targetRoom = room;
                  targetRoomGroup = roomGroup;
                }
              }
            }
          }
        });

        // 创建或更新预览模型
        if (targetRoom && targetRoomGroup) {
          if (!previewMesh) {
            const defaultSize = { width: 0.2, height: 0.15, depth: 0.2 };
            previewMesh = createStorageModel(
              draggingTemplate.template.icon || draggingTemplate.template.name,
              defaultSize,
              0x00ff00
            );
            previewMesh.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x00ff00,
                  transparent: true,
                  opacity: 0.5,
                  metalness: 0.3,
                  roughness: 0.4,
                });
              }
            });
            scene.add(previewMesh);
          }
          
          // 更新预览位置
          const localPos = dragIntersection.clone();
          localPos.sub(targetRoomGroup.position);
          previewMesh.position.set(
            dragIntersection.x,
            0.075,
            dragIntersection.z
          );
        } else {
          // 不在有效位置，移除预览
          if (previewMesh) {
            scene.remove(previewMesh);
            previewMesh.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
            previewMesh = null;
          }
        }
        return;
      }
      
      // 如果正在拖拽已有收纳，更新拖拽位置
      if (isEditing3D && draggingStorage3D && draggingRoomGroup) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // 计算与拖拽平面的交点
        raycaster.ray.intersectPlane(dragPlane, dragIntersection);
        
        // 限制在房间范围内
        const roomLayout = roomLayouts.get(selectedLocation || '')?.find(
          (layout: any) => {
            const room = rooms.find(r => r.id === (draggingRoomGroup as any).userData?.roomId);
            return room && layout.id === room.id;
          }
        );
        
        if (roomLayout && draggingRoomGroup) {
          // 转换为房间局部坐标
          const localPos = dragIntersection.clone();
          localPos.sub(draggingRoomGroup.position);
          
          // 限制在房间范围内
          const roomWidth = roomLayout.width * 0.01;
          const roomHeight = roomLayout.height * 0.01;
          localPos.x = Math.max(-roomWidth / 2, Math.min(roomWidth / 2, localPos.x));
          localPos.z = Math.max(-roomHeight / 2, Math.min(roomHeight / 2, localPos.z));
          
          // 更新收纳位置
          const storageMesh = storageMeshes.get(draggingStorage3D.id);
          if (storageMesh) {
            const worldPos = localPos.clone();
            worldPos.add(draggingRoomGroup.position);
            storageMesh.position.set(worldPos.x, storageMesh.position.y, worldPos.z);
            
            // 同时更新高亮边框位置
            scene.traverse((object) => {
              if ((object as any).userData?.storageId === draggingStorage3D.id && 
                  (object as any).userData?.isHighlight) {
                const highlight = object as THREE.LineSegments;
                const box = new THREE.Box3().setFromObject(storageMesh);
                const boxCenter = box.getCenter(new THREE.Vector3());
                highlight.position.copy(boxCenter);
              }
            });
          }
        }
        return;
      }
      
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let hoveredId: string | null = null;
      for (const intersect of intersects) {
        const object = intersect.object as any;
        // 检查是否是收纳模型或其子对象
        let storageId: string | null = null;
        if (object.userData?.storageId && !object.userData?.isHighlight && !object.userData?.isLabel) {
          storageId = object.userData.storageId;
        } else if (object.parent && (object.parent as any).userData?.storageId) {
          storageId = (object.parent as any).userData.storageId;
        }
        
        if (storageId) {
          hoveredId = storageId;
          break;
        }
      }

      // 更新高亮显示
      scene.traverse((object) => {
        if ((object as any).userData?.isHighlight) {
          const highlight = object as THREE.LineSegments;
          const storageId = (object as any).userData.storageId;
          // 显示悬停或选中的收纳
          highlight.visible = storageId === hoveredId || 
            (isEditing3D && storageId === selectedStorageForEdit);
          
          // 选中状态使用更明显的颜色
          if (isEditing3D && storageId === selectedStorageForEdit) {
            (highlight.material as THREE.LineBasicMaterial).color.setHex(0x00ff00);
            (highlight.material as THREE.LineBasicMaterial).linewidth = 4;
          } else if (storageId === hoveredId) {
            (highlight.material as THREE.LineBasicMaterial).color.setHex(0xffff00);
            (highlight.material as THREE.LineBasicMaterial).linewidth = 3;
          }
        }
      });

      setHoveredStorage3D(hoveredId);
    };

    renderer.domElement.addEventListener('click', onStorageClick);
    renderer.domElement.addEventListener('mousemove', onStorageHover);

    // 键盘事件处理
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEditing3D || !selectedStorageForEdit) return;
      
      const storageMesh = storageMeshes.get(selectedStorageForEdit);
      if (!storageMesh) return;

      switch (event.key.toLowerCase()) {
        case 'r': {
          // 旋转90度
          event.preventDefault();
          const storage = storages.find(s => s.id === selectedStorageForEdit);
          if (storage) {
            const currentRotation = storage.floorplanRotation || 0;
            const newRotation = (currentRotation + 90) % 360;
            storageMesh.rotation.y = (newRotation * Math.PI) / 180;
            updateStorage(selectedStorageForEdit, {
              floorplanRotation: newRotation,
            }).catch(err => {
              console.error('保存旋转角度失败:', err);
            });
          }
          break;
        }
        case 'delete':
        case 'backspace': {
          // 删除收纳
          event.preventDefault();
          if (confirm('确定要删除这个收纳位置吗？')) {
            // 这里需要调用deleteStorage，但需要先检查StorageContext是否有这个方法
            // 暂时使用alert提示
            alert('删除功能需要从物品管理页面操作');
          }
          break;
        }
        case 'escape': {
          // 取消选择
          event.preventDefault();
          setSelectedStorageForEdit(null);
          break;
        }
      }
    };
    
    window.addEventListener('keydown', onKeyDown);

    // 添加轨道控制器
    let controls: any = null;
    controlsRef = controls;
    
    // 尝试使用 OrbitControls
    import('three/examples/jsm/controls/OrbitControls.js')
      .then((module) => {
        const OrbitControls = module.OrbitControls;
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.enablePan = true; // 启用平移
        controls.panSpeed = 1.0; // 平移速度
        controls.rotateSpeed = 0.5; // 旋转速度
        controls.zoomSpeed = 1.0; // 缩放速度
        controls.enableKeys = true; // 启用键盘控制
        controls.keys = {
          LEFT: 'ArrowLeft',
          UP: 'ArrowUp',
          RIGHT: 'ArrowRight',
          BOTTOM: 'ArrowDown'
        };
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        };
        controlsRef = controls;

        // 根据编辑模式启用/禁用控制器
        controls.enabled = !isEditing3D;

        // 更新辅助元素可见性
        const updateHelpersVisibility = () => {
          // 更新网格
          scene.traverse((object) => {
            if (object instanceof THREE.GridHelper) {
              object.visible = showGrid;
            }
            if (object instanceof THREE.AxesHelper) {
              object.visible = showAxes;
            }
            // 更新房间边框
            if ((object as any).userData?.isRoomBorder) {
              object.visible = showRoomBorders;
            }
            // 更新标签
            if ((object as any).userData?.isLabel) {
              object.visible = showLabels;
            }
          });
        };
        updateHelpersVisibility();

        // 动画循环
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          
          // 拖拽处理在 onStorageHover 中完成
          
          // 更新辅助元素可见性
          updateHelpersVisibility();
          
          if (controls && !isEditing3D) {
            controls.update();
          }
          renderer.render(scene, camera);
        };
        animate();
      })
      .catch((error) => {
        console.warn('OrbitControls not available, using basic controls:', error);
      // 如果OrbitControls不可用，使用简单的鼠标控制
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.01);
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
        renderer.render(scene, camera);
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const scale = e.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(scale);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel);

        // 初始渲染
        renderer.render(scene, camera);
      });

    // 处理窗口大小变化
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 重置视角函数
    const resetCamera = () => {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
      renderer.render(scene, camera);
    };

    // 将控制函数存储到容器，以便外部调用
    (container as any).resetCamera = resetCamera;
    (container as any).zoomIn = () => {
      if (controls) {
        // 使用OrbitControls的缩放
        const distance = camera.position.length();
        camera.position.normalize().multiplyScalar(Math.max(5, distance * 0.9));
        controls.update();
      } else {
        camera.position.multiplyScalar(0.9);
      }
      renderer.render(scene, camera);
    };
    (container as any).zoomOut = () => {
      if (controls) {
        // 使用OrbitControls的缩放
        const distance = camera.position.length();
        camera.position.normalize().multiplyScalar(Math.min(50, distance * 1.1));
        controls.update();
      } else {
        camera.position.multiplyScalar(1.1);
      }
      renderer.render(scene, camera);
    };

    // 聚焦到收纳位置（带平滑动画）
    (container as any).focusOnStorage = (storageId: string) => {
      const storageMesh = storageMeshes.get(storageId);
      if (!storageMesh || !controls) return;

      const box = new THREE.Box3().setFromObject(storageMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = Math.max(maxDim * 2.5, 5);

      // 计算相机位置（从斜上方看向收纳）
      const direction = new THREE.Vector3(1, 1, 1).normalize();
      const targetPosition = center.clone().add(direction.multiplyScalar(distance));

      // 平滑动画过渡
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const duration = 1000; // 1秒
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 使用缓动函数（easeInOutCubic）
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startPosition, targetPosition, eased);
        controls.target.lerpVectors(startTarget, center, eased);
        controls.update();
        renderer.render(scene, camera);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    // 切换视角模式
    (container as any).setViewMode = (mode: 'top' | 'front' | 'side' | 'isometric') => {
      if (!controls) return;
      const center = controls.target.clone();

      let targetPosition: THREE.Vector3;
      switch (mode) {
        case 'top':
          targetPosition = new THREE.Vector3(center.x, center.y + 15, center.z);
          break;
        case 'front':
          targetPosition = new THREE.Vector3(center.x, center.y, center.z + 15);
          break;
        case 'side':
          targetPosition = new THREE.Vector3(center.x + 15, center.y, center.z);
          break;
        case 'isometric':
        default:
          targetPosition = new THREE.Vector3(10, 10, 10);
          break;
      }

      // 平滑过渡
      const startPosition = camera.position.clone();
      const duration = 800;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startPosition, targetPosition, eased);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
        renderer.render(scene, camera);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('click', onStorageClick);
      renderer.domElement.removeEventListener('mousemove', onStorageHover);
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      // 清理预览模型
      if (previewMesh) {
        scene.remove(previewMesh);
        previewMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        previewMesh = null;
      }
      if (container && renderer.domElement.parentNode) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // 清理场景
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        if (object instanceof THREE.Sprite) {
          (object.material as THREE.SpriteMaterial).map?.dispose();
          object.material.dispose();
        }
      });
    };
  }, [viewMode, selectedLocation, rooms, storages, roomLayouts, items]);

  // 绘制地图视图
  useEffect(() => {
    if (viewMode === 'map' && mapCanvasRef.current) {
      const canvas = mapCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 设置canvas尺寸
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景网格
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 绘制地点
      locationPositions.forEach((pos) => {
        const location = locations.find(l => l.id === pos.id);
        if (!location) return;

        // 绘制连接线（可选：显示地点之间的关系）
        
        // 绘制地点图标
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
        ctx.fill();

        // 绘制地点名称
        ctx.fillStyle = '#1f2937';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pos.name, pos.x, pos.y + 40);

        // 绘制物品数量
        const locationRooms = rooms.filter(r => r.locationId === pos.id);
        const roomIds = locationRooms.map(r => r.id);
        const locationStorages = storages.filter(s => roomIds.includes(s.roomId));
        const storageIds = locationStorages.map(s => s.id);
        const itemCount = items.filter(item => storageIds.includes(item.storageId)).length;

        if (itemCount > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(pos.x + 15, pos.y - 15, 10, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(itemCount.toString(), pos.x + 15, pos.y - 11);
        }
      });
    }
  }, [viewMode, locations, rooms, storages, items, locationPositions, selectedRoomId, roomLayouts]);

  // 绘制平面图视图
  useEffect(() => {
    if (viewMode === 'floorplan' && floorplanCanvasRef.current && selectedLocation) {
      const canvas = floorplanCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制网格
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 获取该地点的房间
      const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
      const layouts = roomLayouts.get(selectedLocation) || [];

      // 绘制房间
      locationRooms.forEach((room) => {
        let layout = layouts.find(l => l.id === room.id);
        if (!layout) {
          // 默认布局
          const index = locationRooms.indexOf(room);
          layout = {
            id: room.id,
            x: 100 + (index % 3) * 200,
            y: 100 + Math.floor(index / 3) * 150,
            width: 180,
            height: 120,
          };
        }

        // 绘制房间矩形（选中时高亮）
        const isSelected = selectedRoomId === room.id;
        ctx.fillStyle = isSelected ? '#bfdbfe' : '#dbeafe';
        ctx.strokeStyle = isSelected ? '#2563eb' : '#3b82f6';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fillRect(layout.x, layout.y, layout.width, layout.height);
        ctx.strokeRect(layout.x, layout.y, layout.width, layout.height);
        
        // 选中时添加阴影效果
        if (isSelected) {
          ctx.shadowColor = 'rgba(37, 99, 235, 0.3)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.strokeRect(layout.x, layout.y, layout.width, layout.height);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // 绘制调整点（仅在编辑模式下）
        if (isEditing) {
          const handleSize = 8;
          const handles: Array<{ x: number; y: number; type: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' }> = [
            { x: layout.x, y: layout.y, type: 'nw' }, // 左上
            { x: layout.x + layout.width, y: layout.y, type: 'ne' }, // 右上
            { x: layout.x, y: layout.y + layout.height, type: 'sw' }, // 左下
            { x: layout.x + layout.width, y: layout.y + layout.height, type: 'se' }, // 右下
            { x: layout.x + layout.width / 2, y: layout.y, type: 'n' }, // 上
            { x: layout.x + layout.width / 2, y: layout.y + layout.height, type: 's' }, // 下
            { x: layout.x, y: layout.y + layout.height / 2, type: 'w' }, // 左
            { x: layout.x + layout.width, y: layout.y + layout.height / 2, type: 'e' }, // 右
          ];

          handles.forEach(handle => {
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handleSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          });
        }

        // 绘制房间名称（带背景以提高可读性）
        const roomName = room.name;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        const textMetrics = ctx.measureText(roomName);
        const textWidth = textMetrics.width;
        const textHeight = 16;
        const padding = 4;
        
        // 绘制文字背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          layout.x + layout.width / 2 - textWidth / 2 - padding,
          layout.y + 10 - textHeight / 2,
          textWidth + padding * 2,
          textHeight + padding * 2
        );
        
        // 绘制文字
        ctx.fillStyle = isSelected ? '#1e40af' : '#1f2937';
        ctx.fillText(roomName, layout.x + layout.width / 2, layout.y + 20);

        // 绘制收纳位置数量
        const roomStorages = storages.filter(s => s.roomId === room.id && !s.parentStorageId);
        const storageCount = roomStorages.length;
        if (storageCount > 0) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '12px sans-serif';
          ctx.fillText(`${storageCount} 个收纳位置`, layout.x + layout.width / 2, layout.y + 40);
        }
      });
    }
  }, [viewMode, selectedLocation, rooms, storages, roomLayouts]);

  // 处理地图点击（双击进入平面图）
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapCanvasRef.current) return;

    const canvas = mapCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否点击了现有地点
    let clickedLocation: string | null = null;
    locationPositions.forEach((pos) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 20) {
        clickedLocation = pos.id;
      }
    });

    if (clickedLocation) {
      // 点击地点进入平面图编辑
      setSelectedLocation(clickedLocation);
      setViewMode('floorplan');
    }
  };

  // 处理地图拖拽
  const handleMapMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing || !mapCanvasRef.current) return;

    const canvas = mapCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否点击了地点
    locationPositions.forEach((pos) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 20) {
        setIsDragging(true);
        setDragTarget({ type: 'location', id: pos.id });
      }
    });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget || !mapCanvasRef.current) return;

    const canvas = mapCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragTarget.type === 'location') {
      const newPositions = new Map(locationPositions);
      const pos = newPositions.get(dragTarget.id);
      if (pos) {
        newPositions.set(dragTarget.id, { ...pos, x, y });
        setLocationPositions(newPositions);
      }
    }
  };

  const handleMapMouseUp = async () => {
    if (isDragging && dragTarget && dragTarget.type === 'location') {
      // 保存位置到后端
      const pos = locationPositions.get(dragTarget.id);
      if (pos) {
        try {
          await updateLocation(dragTarget.id, { mapX: pos.x, mapY: pos.y });
          // updateLocation 已经会更新 locations 状态，不需要 refreshData
        } catch (error) {
          console.error('保存地点位置失败:', error);
        }
      }
    }
    setIsDragging(false);
    setDragTarget(null);
  };

  // 添加新地点到地图
  const handleAddLocationToMap = () => {
    // 触发添加地点事件
    window.dispatchEvent(new CustomEvent('openAddLocationModal'));
  };

  // 保存房间布局
  const handleSaveRoomLayouts = async () => {
    if (!selectedLocation) return;
    
    const layouts = roomLayouts.get(selectedLocation) || [];
    if (layouts.length === 0) {
      alert('没有可保存的房间布局');
      return;
    }
    
    try {
      // 并行保存所有房间布局
      await Promise.all(
        layouts.map(layout =>
          updateRoom(layout.id, {
            floorplanX: layout.x,
            floorplanY: layout.y,
            floorplanWidth: layout.width,
            floorplanHeight: layout.height,
            floorplanRotation: layout.rotation || 0,
          })
        )
      );
      
      // 只更新 rooms 状态，不刷新整个数据
      // updateRoom 已经会更新 rooms 状态，所以不需要 refreshData
      
      alert('房间布局已保存');
    } catch (error) {
      console.error('保存房间布局失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 获取调整点位置
  const getResizeHandle = (layout: RoomLayout, x: number, y: number): { roomId: string; handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' } | null => {
    const handleSize = 8;
    const handles: Array<{ x: number; y: number; type: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' }> = [
      { x: layout.x, y: layout.y, type: 'nw' },
      { x: layout.x + layout.width, y: layout.y, type: 'ne' },
      { x: layout.x, y: layout.y + layout.height, type: 'sw' },
      { x: layout.x + layout.width, y: layout.y + layout.height, type: 'se' },
      { x: layout.x + layout.width / 2, y: layout.y, type: 'n' },
      { x: layout.x + layout.width / 2, y: layout.y + layout.height, type: 's' },
      { x: layout.x, y: layout.y + layout.height / 2, type: 'w' },
      { x: layout.x + layout.width, y: layout.y + layout.height / 2, type: 'e' },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
      if (distance <= handleSize) {
        return { roomId: layout.id, handle: handle.type };
      }
    }
    return null;
  };

  // 处理平面图点击
  const handleFloorplanClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!floorplanCanvasRef.current || !selectedLocation) return;
    
    const canvas = floorplanCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const layouts = roomLayouts.get(selectedLocation) || [];
    
    // 检查是否点击了房间
    let clickedRoom = false;
    for (const layout of layouts) {
      if (x >= layout.x && x <= layout.x + layout.width &&
          y >= layout.y && y <= layout.y + layout.height) {
        // 如果不在编辑模式，只选择房间
        if (!isEditing) {
          setSelectedRoomId(layout.id);
          clickedRoom = true;
          break;
        }
        // 在编辑模式下，如果点击了调整点或房间，不处理选择
        const handle = getResizeHandle(layout, x, y);
        if (!handle) {
          setSelectedRoomId(layout.id);
          clickedRoom = true;
        }
        break;
      }
    }
    
    // 如果点击空白区域
    if (!clickedRoom) {
      if (isCreatingRoom) {
        // 创建新房间
        handleCreateRoom(x, y);
      } else {
        // 取消选择
        setSelectedRoomId(null);
      }
    }
  };

  // 创建房间
  const handleCreateRoom = async (x: number, y: number) => {
    if (!selectedLocation) return;
    
    const name = prompt('请输入房间名称：');
    if (!name || name.trim() === '') {
      setIsCreatingRoom(false);
      return;
    }
    
    try {
      await addRoom({
        name: name.trim(),
        locationId: selectedLocation,
        floorplanX: x,
        floorplanY: y,
        floorplanWidth: 180,
        floorplanHeight: 120,
      });
      
      // addRoom会更新rooms状态，useEffect会自动处理新房间的布局
      // 这里我们只需要等待rooms更新后选中新房间
      // 由于状态更新是异步的，我们使用一个小的延迟来确保状态已更新
      const checkForNewRoom = () => {
        const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
        const newRoom = locationRooms.find(r => 
          Math.abs((r.floorplanX || 0) - x) < 1 && 
          Math.abs((r.floorplanY || 0) - y) < 1 && 
          r.name === name.trim()
        );
        
        if (newRoom) {
          // 更新 roomLayouts
          const layouts = roomLayouts.get(selectedLocation) || [];
          if (!layouts.find(l => l.id === newRoom.id)) {
            layouts.push({
              id: newRoom.id,
              x,
              y,
              width: 180,
              height: 120,
              rotation: 0,
            });
            setRoomLayouts(new Map(roomLayouts).set(selectedLocation, layouts));
          }
          
          setSelectedRoomId(newRoom.id);
          setIsCreatingRoom(false);
        } else {
          // 如果还没找到，再试一次
          setTimeout(checkForNewRoom, 50);
        }
      };
      
      setTimeout(checkForNewRoom, 100);
    } catch (error) {
      console.error('创建房间失败:', error);
      alert('创建房间失败，请重试');
      setIsCreatingRoom(false);
    }
  };

  // 处理平面图拖拽
  const handleFloorplanMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing || !floorplanCanvasRef.current || !selectedLocation) return;

    const canvas = floorplanCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const layouts = roomLayouts.get(selectedLocation) || [];
    
    // 首先检查是否点击了调整点
    for (const layout of layouts) {
      const handle = getResizeHandle(layout, x, y);
      if (handle) {
        setResizeHandle(handle);
        setResizeStart({ x, y, width: layout.width, height: layout.height });
        return;
      }
    }

    // 检查是否点击了房间（用于移动）
    layouts.forEach((layout) => {
      if (x >= layout.x && x <= layout.x + layout.width &&
          y >= layout.y && y <= layout.y + layout.height) {
        setIsDragging(true);
        setDragTarget({ type: 'room', id: layout.id });
      }
    });
  };

  const handleFloorplanMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!floorplanCanvasRef.current || !selectedLocation) return;

    const canvas = floorplanCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const layouts = roomLayouts.get(selectedLocation) || [];

    // 处理调整大小
    if (resizeHandle && resizeStart) {
      const layout = layouts.find(l => l.id === resizeHandle.roomId);
      if (layout) {
        const dx = x - resizeStart.x;
        const dy = y - resizeStart.y;
        let newX = layout.x;
        let newY = layout.y;
        let newWidth = layout.width;
        let newHeight = layout.height;

        switch (resizeHandle.handle) {
          case 'nw': // 左上角
            newX = layout.x + dx;
            newY = layout.y + dy;
            newWidth = resizeStart.width - dx;
            newHeight = resizeStart.height - dy;
            break;
          case 'ne': // 右上角
            newY = layout.y + dy;
            newWidth = resizeStart.width + dx;
            newHeight = resizeStart.height - dy;
            break;
          case 'sw': // 左下角
            newX = layout.x + dx;
            newWidth = resizeStart.width - dx;
            newHeight = resizeStart.height + dy;
            break;
          case 'se': // 右下角
            newWidth = resizeStart.width + dx;
            newHeight = resizeStart.height + dy;
            break;
          case 'n': // 上边
            newY = layout.y + dy;
            newHeight = resizeStart.height - dy;
            break;
          case 's': // 下边
            newHeight = resizeStart.height + dy;
            break;
          case 'w': // 左边
            newX = layout.x + dx;
            newWidth = resizeStart.width - dx;
            break;
          case 'e': // 右边
            newWidth = resizeStart.width + dx;
            break;
        }

        // 限制最小尺寸
        const minSize = 50;
        if (newWidth < minSize) {
          newWidth = minSize;
          if (resizeHandle.handle.includes('w')) {
            newX = layout.x + layout.width - minSize;
          }
        }
        if (newHeight < minSize) {
          newHeight = minSize;
          if (resizeHandle.handle.includes('n')) {
            newY = layout.y + layout.height - minSize;
          }
        }

        const newLayouts = new Map(roomLayouts);
        const updatedLayouts = layouts.map(l =>
          l.id === resizeHandle.roomId
            ? { ...l, x: newX, y: newY, width: newWidth, height: newHeight }
            : l
        );
        newLayouts.set(selectedLocation, updatedLayouts);
        setRoomLayouts(newLayouts);
      }
      return;
    }

    // 处理移动房间
    if (isDragging && dragTarget && dragTarget.type === 'room') {
      const layout = layouts.find(l => l.id === dragTarget.id);
      if (layout) {
        const newLayouts = new Map(roomLayouts);
        const updatedLayouts = layouts.map(l =>
          l.id === dragTarget.id
            ? { ...l, x: x - l.width / 2, y: y - l.height / 2 }
            : l
        );
        newLayouts.set(selectedLocation, updatedLayouts);
        setRoomLayouts(newLayouts);
      }
    }
  };

  const handleFloorplanMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setResizeHandle(null);
    setResizeStart(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部工具栏 */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              可视化视图
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">地图、平面图和3D视图管理储物空间</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-mint-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEditing ? '完成编辑' : '编辑模式'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 视图切换标签 */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode('map');
              setSelectedLocation(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-mint-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm">地图视图</span>
          </button>
          <button
            onClick={() => {
              if (selectedLocation) {
                setViewMode('floorplan');
              } else if (locations.length > 0) {
                // 如果没有选择地点，默认选择第一个地点
                setSelectedLocation(locations[0].id);
                setViewMode('floorplan');
              } else {
                alert('请先添加地点');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'floorplan'
                ? 'bg-mint-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={locations.length === 0}
          >
            <Grid className="w-4 h-4" />
            <span className="text-sm">平面图</span>
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === '3d'
                ? 'bg-mint-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span className="text-sm">3D视图</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>
        {viewMode === 'map' && (
          <div className="h-full relative">
            <canvas
              ref={mapCanvasRef}
              className="w-full h-full cursor-crosshair"
              onClick={handleMapClick}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onMouseLeave={handleMapMouseUp}
            />
            {isEditing && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4">
                <div className="text-sm text-gray-600 mb-2">编辑提示：</div>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 拖拽地点图标移动位置</li>
                  <li>• 双击地点进入平面图编辑</li>
                  <li>• 点击右上角 + 添加新地点</li>
                </ul>
              </div>
            )}
            {isEditing && (
              <button
                onClick={handleAddLocationToMap}
                className="absolute top-4 left-4 p-3 btn-mint rounded-lg shadow-lg text-white transition-colors"
                title="添加地点"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {viewMode === 'floorplan' && selectedLocation && (
          <div className="h-full relative">
            {/* 左侧房间列表面板 */}
            <div 
              className="absolute left-4 top-20 w-64 bg-white rounded-lg shadow-lg border border-gray-300 flex flex-col" 
              style={{ maxHeight: 'calc(100vh - 8rem)', zIndex: 100 }}
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-sm">房间列表</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {rooms.filter(r => r.locationId === selectedLocation).length} 个房间
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {rooms
                  .filter(r => r.locationId === selectedLocation)
                  .map((room) => {
                    const roomStorages = storages.filter(s => s.roomId === room.id && !s.parentStorageId);
                    const roomItems = items.filter(item => roomStorages.some(s => s.id === item.storageId));
                    const totalQuantity = roomItems.reduce((sum, item) => sum + item.quantity, 0);
                    const isSelected = selectedRoomId === room.id;
                    
                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setIsCreatingRoom(false);
                          // 滚动到房间位置（如果可能）
                          const layout = roomLayouts.get(selectedLocation)?.find(l => l.id === room.id);
                          if (layout && floorplanCanvasRef.current) {
                            const canvas = floorplanCanvasRef.current;
                            const centerX = layout.x + layout.width / 2;
                            const centerY = layout.y + layout.height / 2;
                            // 可以添加滚动逻辑，但canvas不支持滚动，所以这里只是选中
                          }
                        }}
                        className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-mint-50 border-2 border-mint-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {room.icon && <span className="text-lg">{room.icon}</span>}
                              <span className={`font-medium text-sm truncate ${isSelected ? 'text-mint-700' : 'text-gray-900'}`}>
                                {room.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Box className="w-3 h-3" />
                                {roomStorages.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {totalQuantity}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-mint-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {rooms.filter(r => r.locationId === selectedLocation).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>还没有房间</p>
                    <p className="text-xs mt-1">点击"添加房间"开始创建</p>
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className="absolute top-4 left-72 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 z-10"
            >
              <button
                onClick={() => {
                  setViewMode('map');
                  setSelectedRoomId(null);
                  setIsCreatingRoom(false);
                }}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                ← 返回地图
              </button>
              <span className="text-sm text-gray-500">
                {locations.find(l => l.id === selectedLocation)?.name}
              </span>
              <span className="text-xs text-gray-400">
                ({rooms.filter(r => r.locationId === selectedLocation).length} 个房间)
              </span>
              <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-2">
                <button
                  onClick={() => {
                    setIsCreatingRoom(!isCreatingRoom);
                    setSelectedRoomId(null);
                  }}
                  className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                    isCreatingRoom
                      ? 'bg-mint-600 text-white hover:bg-mint-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  添加房间
                </button>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setIsCreatingRoom(false);
                    if (!isEditing) {
                      setSelectedRoomId(null);
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                    isEditing
                      ? 'bg-mint-600 text-white hover:bg-mint-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  {isEditing ? '编辑中' : '编辑布局'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSaveRoomLayouts}
                    className="px-3 py-1 text-sm btn-mint rounded transition-colors flex items-center gap-1 text-white"
                  >
                    <Save className="w-4 h-4" />
                    保存布局
                  </button>
                )}
              </div>
            </div>
            <canvas
              ref={floorplanCanvasRef}
              className={`w-full h-full ${
                resizeHandle ? 'cursor-nwse-resize' : 
                isDragging ? 'cursor-move' : 
                isCreatingRoom ? 'cursor-crosshair' :
                isEditing ? 'cursor-default' : 'cursor-pointer'
              }`}
              onClick={handleFloorplanClick}
              onMouseDown={handleFloorplanMouseDown}
              onMouseMove={(e) => {
                // 更新鼠标样式
                if (isEditing && floorplanCanvasRef.current && selectedLocation) {
                  const canvas = floorplanCanvasRef.current;
                  const rect = canvas.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const layouts = roomLayouts.get(selectedLocation) || [];
                  
                  let cursor = 'default';
                  for (const layout of layouts) {
                    const handle = getResizeHandle(layout, x, y);
                    if (handle) {
                      if (handle.handle === 'nw' || handle.handle === 'se') {
                        cursor = 'nwse-resize';
                      } else if (handle.handle === 'ne' || handle.handle === 'sw') {
                        cursor = 'nesw-resize';
                      } else if (handle.handle === 'n' || handle.handle === 's') {
                        cursor = 'ns-resize';
                      } else if (handle.handle === 'e' || handle.handle === 'w') {
                        cursor = 'ew-resize';
                      }
                      break;
                    } else if (x >= layout.x && x <= layout.x + layout.width &&
                               y >= layout.y && y <= layout.y + layout.height) {
                      cursor = 'move';
                    }
                  }
                  canvas.style.cursor = cursor;
                }
                handleFloorplanMouseMove(e);
              }}
              onMouseUp={handleFloorplanMouseUp}
              onMouseLeave={handleFloorplanMouseUp}
            />
            {/* 房间详情侧边栏 */}
            {selectedRoomId && !isCreatingRoom && (() => {
              const room = rooms.find(r => r.id === selectedRoomId);
              if (!room) return null;
              const layout = roomLayouts.get(selectedLocation)?.find(l => l.id === room.id);
              const roomStorages = storages.filter(s => s.roomId === room.id && !s.parentStorageId);
              const roomItems = items.filter(item => roomStorages.some(s => s.id === item.storageId));
              const totalQuantity = roomItems.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <div 
                  className="absolute right-4 top-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col" 
                  style={{ maxHeight: 'calc(100vh - 8rem)', zIndex: 100 }}
                >
                  {/* 面板头部 */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">房间详情</h3>
                      <button
                        onClick={() => setSelectedRoomId(null)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 面板内容 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* 房间名称编辑 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        房间名称
                      </label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          updateRoom(room.id, { name: newName });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint text-sm"
                        placeholder="输入房间名称"
                      />
                    </div>
                    
                    {/* 房间图标（可选） */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        图标
                      </label>
                      <input
                        type="text"
                        value={room.icon || ''}
                        onChange={(e) => {
                          updateRoom(room.id, { icon: e.target.value || undefined });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint text-sm"
                        placeholder="输入图标（如：🏠）"
                      />
                    </div>
                    
                    {/* 房间尺寸信息 */}
                    {layout && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">尺寸信息</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">宽度</div>
                            <div className="font-medium">{Math.round(layout.width)}px</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">高度</div>
                            <div className="font-medium">{Math.round(layout.height)}px</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">X坐标</div>
                            <div className="font-medium">{Math.round(layout.x)}px</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500">Y坐标</div>
                            <div className="font-medium">{Math.round(layout.y)}px</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 统计信息 */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">统计信息</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-mint-50 p-2 rounded">
                          <div className="text-gray-600">收纳数量</div>
                          <div className="font-medium text-mint-600">{roomStorages.length}</div>
                        </div>
                        <div className="bg-mint-100 p-2 rounded">
                          <div className="text-gray-600">物品总数</div>
                          <div className="font-medium text-mint-700">{totalQuantity}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 删除按钮 */}
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          if (roomStorages.length > 0) {
                            const confirm = window.confirm(
                              `该房间下有 ${roomStorages.length} 个收纳位置，删除房间将同时删除这些收纳。确定要删除吗？`
                            );
                            if (!confirm) return;
                          } else {
                            const confirm = window.confirm('确定要删除这个房间吗？');
                            if (!confirm) return;
                          }
                          
                          try {
                            await deleteRoom(room.id);
                            // 从 roomLayouts 中移除
                            const layouts = roomLayouts.get(selectedLocation) || [];
                            const newLayouts = layouts.filter(l => l.id !== room.id);
                            setRoomLayouts(new Map(roomLayouts).set(selectedLocation, newLayouts));
                            setSelectedRoomId(null);
                          } catch (error) {
                            console.error('删除房间失败:', error);
                            alert('删除房间失败，请重试');
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        删除房间
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {(isEditing || isCreatingRoom) && (
              <div 
                className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4"
              >
                <div className="text-sm text-gray-600 mb-2">
                  {isCreatingRoom ? '创建房间模式' : '平面图编辑'}
                </div>
                <ul className="text-xs text-gray-500 space-y-1">
                  {isCreatingRoom ? (
                    <li>• 点击画布空白区域创建新房间</li>
                  ) : (
                    <>
                      <li>• 拖拽房间调整位置</li>
                      <li>• 拖拽调整点改变房间大小</li>
                      <li>• 点击"保存布局"保存更改</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {viewMode === '3d' && (
          <div className="h-full relative bg-gray-900">
            {/* 3D画布 - 全屏 */}
            <div className="h-full w-full relative">
              <div ref={threeContainerRef} className="h-full w-full absolute inset-0" style={{ zIndex: 1, pointerEvents: 'auto' }} />
              
              {/* UI容器 - 用于CSS2DRenderer */}
              <div id="ui-container-3d" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />
              
              {/* 左侧面板 - 房间和收纳结构树（3D空间中的UI） */}
              {selectedLocation ? (
                <div 
                  id="left-panel-3d"
                  className="absolute w-64 bg-white backdrop-blur-sm rounded-lg shadow-2xl border border-gray-300 flex flex-col"
                  style={{ pointerEvents: 'auto', zIndex: 100, maxHeight: 'calc(100vh - 2rem)', left: '1rem', top: '1rem' }}
                >
                {/* 面板头部 */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-1">房间结构</h3>
                  <p className="text-xs text-gray-500">
                    {locations.find(l => l.id === selectedLocation)?.name}
                  </p>
                </div>

                {/* 标签切换：房间树 / 收纳库 */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setShowStorageLibrary(false)}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      !showStorageLibrary
                        ? 'bg-mint-50 text-mint-600 border-b-2 border-mint-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    房间树
                  </button>
                  <button
                    onClick={() => setShowStorageLibrary(true)}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      showStorageLibrary
                        ? 'bg-mint-50 text-mint-600 border-b-2 border-mint-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    收纳库
                  </button>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                  {!showStorageLibrary ? (
                    // 房间树视图
                    (() => {
                      const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
                      return (
                        <div className="p-2">
                          {locationRooms.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              暂无房间
                            </div>
                          ) : (
                            locationRooms.map(room => {
                              const roomStorages = storages.filter(
                                s => s.roomId === room.id && !s.parentStorageId
                              );
                              const isRoomExpanded = expandedRooms.has(room.id);

                              const renderStorage = (storage: typeof storages[0], level: number = 0) => {
                                const childStorages = storages.filter(s => s.parentStorageId === storage.id);
                                const isStorageExpanded = expandedStorages.has(storage.id);
                                const storageItems = items.filter(item => item.storageId === storage.id);
                                const itemCount = storageItems.reduce((sum, item) => sum + item.quantity, 0);

                                return (
                                  <div key={storage.id} className="mb-1">
                                    <div
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                                        selectedStorage3D === storage.id ? 'bg-mint-50 text-mint-600' : ''
                                      }`}
                                      style={{ paddingLeft: `${0.5 + level * 1}rem` }}
                                      onClick={() => setSelectedStorage3D(storage.id)}
                                    >
                                      {childStorages.length > 0 ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newExpanded = new Set(expandedStorages);
                                            if (newExpanded.has(storage.id)) {
                                              newExpanded.delete(storage.id);
                                            } else {
                                              newExpanded.add(storage.id);
                                            }
                                            setExpandedStorages(newExpanded);
                                          }}
                                          className="p-0.5"
                                        >
                                          {isStorageExpanded ? (
                                            <ChevronDown className="w-3 h-3" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3" />
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-3" />
                                      )}
                                      <Archive className="w-4 h-4 flex-shrink-0" />
                                      <span className="flex-1 text-sm truncate">{storage.name}</span>
                                      {itemCount > 0 && (
                                        <span className="text-xs text-gray-500">{itemCount}</span>
                                      )}
                                    </div>
                                    {isStorageExpanded && childStorages.length > 0 && (
                                      <div className="mt-1">
                                        {childStorages.map(child => renderStorage(child, level + 1))}
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return (
                                <div key={room.id} className="mb-2">
                                  <div
                                    className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors font-medium ${
                                      selectedStorage3D && roomStorages.some(s => s.id === selectedStorage3D)
                                        ? 'bg-mint-50'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      const newExpanded = new Set(expandedRooms);
                                      if (newExpanded.has(room.id)) {
                                        newExpanded.delete(room.id);
                                      } else {
                                        newExpanded.add(room.id);
                                      }
                                      setExpandedRooms(newExpanded);
                                    }}
                                  >
                                    <button className="p-0.5">
                                      {isRoomExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                    <DoorOpen className="w-4 h-4" />
                                    <span className="flex-1 text-sm">{room.name}</span>
                                    <span className="text-xs text-gray-500">{roomStorages.length}</span>
                                  </div>
                                  {isRoomExpanded && (
                                    <div className="mt-1 ml-4">
                                      {roomStorages.map(storage => renderStorage(storage, 0))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // 收纳库视图
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="搜索收纳模板..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:outline-none ring-mint"
                          />
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-3">常用收纳模板</div>
                      <div className="space-y-2">
                        {[
                          { name: '衣柜', icon: '📁', description: '标准衣柜收纳' },
                          { name: '抽屉', icon: '📦', description: '抽屉收纳盒' },
                          { name: '书架', icon: '📚', description: '书架收纳' },
                          { name: '储物箱', icon: '📦', description: '储物箱收纳' },
                          { name: '鞋柜', icon: '👟', description: '鞋柜收纳' },
                        ].map((template, index) => {
                          const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
                          return (
                            <div
                              key={index}
                              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                              draggable={viewMode === '3d' && isEditing3D}
                              onDragStart={(e) => {
                                if (viewMode === '3d' && isEditing3D && selectedLocation) {
                                  setDraggingTemplate({
                                    template,
                                    previewMesh: null,
                                  });
                                  e.dataTransfer.effectAllowed = 'copy';
                                } else {
                                  e.preventDefault();
                                }
                              }}
                              onDragEnd={() => {
                                setDraggingTemplate(null);
                              }}
                              onClick={async () => {
                                if (viewMode === '3d' && isEditing3D) return; // 编辑模式下使用拖拽
                                if (!selectedLocation) {
                                  alert('请先选择一个地点');
                                  return;
                                }
                                if (locationRooms.length === 0) {
                                  alert('该地点下还没有房间，请先添加房间');
                                  return;
                                }
                                // 如果有多个房间，让用户选择；如果只有一个，直接使用
                                if (locationRooms.length === 1) {
                                  try {
                                    await addStorage({
                                      name: template.name,
                                      roomId: locationRooms[0].id,
                                      description: template.description,
                                      icon: template.icon,
                                    });
                                    alert(`已创建收纳位置：${template.name}`);
                                  } catch (err) {
                                    alert(`创建失败：${err instanceof Error ? err.message : '未知错误'}`);
                                  }
                                } else {
                                  // 多个房间时，显示选择对话框
                                  const roomName = prompt(`请选择房间（输入房间名称）:\n${locationRooms.map(r => `- ${r.name}`).join('\n')}`);
                                  if (roomName) {
                                    const selectedRoom = locationRooms.find(r => r.name === roomName);
                                    if (selectedRoom) {
                                      try {
                                        await addStorage({
                                          name: template.name,
                                          roomId: selectedRoom.id,
                                          description: template.description,
                                          icon: template.icon,
                                        });
                                        alert(`已创建收纳位置：${template.name}`);
                                      } catch (err) {
                                        alert(`创建失败：${err instanceof Error ? err.message : '未知错误'}`);
                                      }
                                    } else {
                                      alert('未找到该房间');
                                    }
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{template.icon}</span>
                                <span className="font-medium text-sm">{template.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">{template.description}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute left-4 top-4 w-64 bg-white backdrop-blur-sm rounded-lg shadow-2xl border border-gray-300 flex items-center justify-center p-8" style={{ zIndex: 100 }}>
                <div className="text-center text-gray-400">
                  <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请在地图视图中选择一个地点</p>
                </div>
              </div>
            )}

              {/* 编辑模式控制 - 在画布上（左上角，在左侧面板下方） */}
              {selectedLocation && (
                <div className="absolute left-4 top-72 flex flex-col gap-2" style={{ pointerEvents: 'auto', zIndex: 100 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing3D(!isEditing3D);
                    }}
                    className={`p-2.5 rounded-lg shadow-lg transition-colors border border-gray-200 ${
                      isEditing3D
                        ? 'bg-mint-500 hover:bg-mint-600 text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    title={isEditing3D ? '退出编辑' : '编辑布局'}
                  >
                    {isEditing3D ? <X className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  </button>
                  {isEditing3D && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        // 保存所有收纳位置的布局
                        const locationRooms = rooms.filter(r => r.locationId === selectedLocation);
                        for (const room of locationRooms) {
                          const roomStorages = storages.filter(
                            s => s.roomId === room.id && !s.parentStorageId
                          );
                          for (const storage of roomStorages) {
                            // 从3D场景中获取当前的位置和尺寸
                            // 这里需要从Three.js场景中读取数据
                            // 暂时使用已有的floorplan数据
                            if (storage.floorplanX !== undefined && storage.floorplanY !== undefined) {
                              await updateStorage(storage.id, {
                                floorplanX: storage.floorplanX,
                                floorplanY: storage.floorplanY,
                                floorplanWidth: storage.floorplanWidth,
                                floorplanHeight: storage.floorplanHeight,
                                floorplanRotation: storage.floorplanRotation,
                              });
                            }
                          }
                        }
                        alert('布局已保存');
                      }}
                      className="p-2.5 bg-mint-500 hover:bg-mint-600 text-white rounded-lg shadow-lg transition-colors border border-gray-200"
                      title="保存布局"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* 3D控制面板 - 右下角 */}
              {selectedLocation && viewMode === '3d' && (
                <div 
                  className="absolute flex flex-col gap-2" 
                  style={{ pointerEvents: 'auto', zIndex: 100, bottom: '1rem', right: '1rem' }}
                >
                  {/* 重置视角/指南针 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (threeContainerRef.current && (threeContainerRef.current as any).resetCamera) {
                        (threeContainerRef.current as any).resetCamera();
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                    title="重置视角"
                  >
                    <Compass className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* 聚焦到选中收纳 */}
                  {selectedStorage3D && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (threeContainerRef.current && (threeContainerRef.current as any).focusOnStorage) {
                          (threeContainerRef.current as any).focusOnStorage(selectedStorage3D);
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                      title="聚焦到选中收纳"
                    >
                      <Target className="w-5 h-5 text-gray-700" />
                    </button>
                  )}

                  {/* 视角模式切换 */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const modes: Array<'isometric' | 'top' | 'front' | 'side'> = ['isometric', 'top', 'front', 'side'];
                        const currentIndex = modes.indexOf(cameraViewMode);
                        const nextMode = modes[(currentIndex + 1) % modes.length];
                        setCameraViewMode(nextMode);
                        if (threeContainerRef.current && (threeContainerRef.current as any).setViewMode) {
                          (threeContainerRef.current as any).setViewMode(nextMode);
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                      title={`视角: ${cameraViewMode === 'isometric' ? '等轴测' : cameraViewMode === 'top' ? '顶视图' : cameraViewMode === 'front' ? '前视图' : '侧视图'}`}
                    >
                      <Camera className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>

                  {/* 辅助元素切换 */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGrid(!showGrid);
                        setShowRoomBorders(!showRoomBorders);
                        setShowLabels(!showLabels);
                      }}
                      className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
                      title={showGrid ? '隐藏辅助元素' : '显示辅助元素'}
                    >
                      {showGrid ? <Eye className="w-5 h-5 text-gray-700" /> : <EyeOff className="w-5 h-5 text-gray-700" />}
                    </button>
                  </div>

                  {/* 缩放控制 */}
                  <div className="flex flex-col gap-1 bg-white rounded-full shadow-lg border border-gray-200 p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (threeContainerRef.current && (threeContainerRef.current as any).zoomIn) {
                          (threeContainerRef.current as any).zoomIn();
                        }
                      }}
                      className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      title="放大"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                    <div className="h-px bg-gray-200 mx-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (threeContainerRef.current && (threeContainerRef.current as any).zoomOut) {
                          (threeContainerRef.current as any).zoomOut();
                        }
                      }}
                      className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      title="缩小"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}

              {/* 图例 - 右上角 */}
              {selectedLocation && viewMode === '3d' && (
                <div 
                  className="absolute bg-white backdrop-blur-sm rounded-lg shadow-2xl p-3 border border-gray-300 max-w-xs" 
                  style={{ pointerEvents: 'auto', zIndex: 100, top: '1rem', right: '1rem' }}
                >
                  <div className="text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span>图例</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-mint-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-600">少量物品</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-600">中等物品</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                      <span className="text-gray-600">大量物品</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <div className="w-4 h-4 border-2 border-mint-500 flex-shrink-0"></div>
                      <span className="text-gray-600">房间</span>
                    </div>
                    {isEditing3D && (
                      <>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <div className="w-4 h-4 border-2 border-yellow-500 flex-shrink-0"></div>
                          <span className="text-gray-600">选中收纳</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          <div>• 点击收纳选中</div>
                          <div>• Shift+点击拖拽</div>
                          <div>• R键旋转90°</div>
                          <div>• Delete删除</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 右侧面板 - 收纳信息（3D空间中的UI） */}
              {selectedStorage3D ? (
                <div 
                  id="right-panel-3d"
                  className="absolute w-80 bg-white backdrop-blur-sm rounded-lg shadow-2xl border border-gray-300 flex flex-col"
                  style={{ pointerEvents: 'auto', zIndex: 100, maxHeight: 'calc(100vh - 2rem)', right: '1rem', top: '1rem' }}
                >
                  {(() => {
                      const storage = storages.find(s => s.id === selectedStorage3D);
                    if (!storage) return null;
                    const storageItems = items.filter(item => item.storageId === storage.id);
                    const totalQuantity = storageItems.reduce((sum, item) => sum + item.quantity, 0);
                    const room = rooms.find(r => r.id === storage.roomId);
                    const childStorages = storages.filter(s => s.parentStorageId === storage.id);
                    
                    return (
                    <>
                      {/* 面板头部 */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {storage.name}
                          </h3>
                          <button
                            onClick={() => setSelectedStorage3D(null)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600">
                          房间: {room?.name || '未知'}
                        </div>
                      </div>

                      {/* 标签切换 */}
                      <div className="flex border-b border-gray-200">
                        <button
                          onClick={() => setRightPanelTab('items')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            rightPanelTab === 'items'
                              ? 'bg-mint-50 text-mint-600 border-b-2 border-mint-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          物品列表
                        </button>
                        <button
                          onClick={() => setRightPanelTab('details')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            rightPanelTab === 'details'
                              ? 'bg-mint-50 text-mint-600 border-b-2 border-mint-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          详细信息
                        </button>
                      </div>

                      {/* 内容区域 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {rightPanelTab === 'items' ? (
                          <>
                            {/* 基本信息 */}
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-700 mb-2">基本信息</div>
                              <div className="space-y-2 text-sm">
                                {storage.description && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">描述:</span> {storage.description}
                                  </div>
                                )}
                                <div className="text-gray-600">
                                  <span className="font-medium">物品总数:</span> {totalQuantity} 件
                                </div>
                                {childStorages.length > 0 && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">子收纳:</span> {childStorages.length} 个
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 物品列表 */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-3">物品列表</div>
                              {storageItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  暂无物品
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {storageItems.map(item => (
                                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="font-medium text-sm text-gray-900 mb-1">{item.name}</div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>数量: {item.quantity} {item.unit || '件'}</div>
                                        {item.categoryId && (() => {
                                          const category = categories.find(c => c.id === item.categoryId);
                                          return category && (
                                            <div>分类: {category.name}</div>
                                          );
                                        })()}
                                        {item.price && (
                                          <div>价格: ¥{item.price}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          /* 详细信息 */
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">收纳位置信息</div>
                              <div className="space-y-2 text-sm">
                                <div className="text-gray-600">
                                  <span className="font-medium">名称:</span> {storage.name}
                                </div>
                                {storage.description && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">描述:</span> {storage.description}
                                  </div>
                                )}
                                <div className="text-gray-600">
                                  <span className="font-medium">房间:</span> {room?.name || '未知'}
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">地点:</span> {locations.find(l => l.id === room?.locationId)?.name || '未知'}
                                </div>
                                {storage.icon && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">图标:</span> {storage.icon}
                                  </div>
                                )}
                                {storage.created_at && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">创建时间:</span> {new Date(storage.created_at).toLocaleString('zh-CN')}
                                  </div>
                                )}
                                {storage.updated_at && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">更新时间:</span> {new Date(storage.updated_at).toLocaleString('zh-CN')}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">统计信息</div>
                              <div className="space-y-2 text-sm">
                                <div className="text-gray-600">
                                  <span className="font-medium">物品总数:</span> {totalQuantity} 件
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">物品种类:</span> {storageItems.length} 种
                                </div>
                                {childStorages.length > 0 && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">子收纳数量:</span> {childStorages.length} 个
                                  </div>
                                )}
                              </div>
                            </div>

                            {childStorages.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">子收纳列表</div>
                                <div className="space-y-2">
                                  {childStorages.map(child => {
                                    const childItems = items.filter(item => item.storageId === child.id);
                                    const childQuantity = childItems.reduce((sum, item) => sum + item.quantity, 0);
                                    return (
                                      <div key={child.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="font-medium text-sm text-gray-900 mb-1">{child.name}</div>
                                        <div className="text-xs text-gray-600">
                                          物品: {childQuantity} 件 ({childItems.length} 种)
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {storage.floorplanX !== undefined && storage.floorplanY !== undefined && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">布局信息</div>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">位置:</span> ({storage.floorplanX?.toFixed(1) || 0}, {storage.floorplanY?.toFixed(1) || 0})
                                  </div>
                                  {storage.floorplanWidth && storage.floorplanHeight && (
                                    <div>
                                      <span className="font-medium">尺寸:</span> {storage.floorplanWidth.toFixed(1)} × {storage.floorplanHeight.toFixed(1)}
                                    </div>
                                  )}
                                  {storage.floorplanRotation && (
                                    <div>
                                      <span className="font-medium">旋转角度:</span> {storage.floorplanRotation.toFixed(1)}°
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                    );
                  })()}
                </div>
              ) : (
                <div className="absolute right-4 top-4 w-80 bg-white backdrop-blur-sm rounded-lg shadow-2xl border border-gray-300 flex items-center justify-center p-8" style={{ zIndex: 100 }}>
                  <div className="text-center text-gray-400">
                    <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">点击收纳查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
