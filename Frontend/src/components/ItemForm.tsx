import React, { useState, useEffect } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Item } from '../types';
import { X, Plus, Minus, Calendar, DollarSign, Tag, BarChart3, Hash, Image as ImageIcon, ChevronRight, ChevronDown, Key, FileText, CreditCard, QrCode, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface ItemFormProps {
  item?: Item;
  onClose: () => void;
  quickMode?: boolean;
  templateData?: Partial<Item>;
}

export function ItemForm({ item, onClose, quickMode: initialQuickMode, templateData }: ItemFormProps) {
  const { addItem, updateItem, storages, getStoragePath, categories, tags, tagGroups, items } = useStorage();

  // 监听快速模式事件
  useEffect(() => {
    const handleQuickMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setQuickMode(true);
      }
    };
    window.addEventListener('itemFormQuickMode', handleQuickMode);
    return () => {
      window.removeEventListener('itemFormQuickMode', handleQuickMode);
    };
  }, []);

  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    description: '',
    storageId: '',
    categoryId: undefined,
    attributes: {},
    tags: [],
    price: undefined,
    purchaseDate: '',
    depreciationRate: undefined,
    expiryDate: '',
    quantity: 1,
    unit: '件',
    minThreshold: undefined,
    maxThreshold: undefined,
    rfid: '',
    barcode: '',
    brand: '',
    ...templateData,
    ...item,
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [quickMode, setQuickMode] = useState(initialQuickMode || false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<{
    category?: string;
    brand?: string;
    price?: { min: number; max: number };
    tags?: string[];
  }>({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // 加载模板列表
  const loadTemplates = (): ItemTemplate[] => {
    try {
      const stored = localStorage.getItem('itemTemplates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveTemplate = (template: Omit<ItemTemplate, 'id' | 'createdAt'>) => {
    const templates = loadTemplates();
    const newTemplate: ItemTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    localStorage.setItem('itemTemplates', JSON.stringify(templates));
  };

  const applyTemplate = (template: ItemTemplate) => {
    setFormData(prev => ({
      ...prev,
      categoryId: template.categoryId || prev.categoryId,
      attributes: { ...prev.attributes, ...template.defaultAttributes },
      tags: template.defaultTags ? [...(prev.tags || []), ...template.defaultTags] : prev.tags,
      price: template.defaultPrice || prev.price,
      unit: template.defaultUnit || prev.unit,
      brand: template.defaultBrand || prev.brand,
      description: template.defaultDescription || prev.description,
    }));
    setShowTemplateSelector(false);
  };

  // 生成智能建议
  useEffect(() => {
    const newSuggestions: typeof suggestions = {};
    
    // 根据分类建议
    if (formData.categoryId) {
      const categoryItems = items.filter(i => i.categoryId === formData.categoryId);
      if (categoryItems.length > 0) {
        // 建议品牌（最常见的品牌）
        const brandCounts: Record<string, number> = {};
        categoryItems.forEach(item => {
          if (item.brand) {
            brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
          }
        });
        const mostCommonBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (mostCommonBrand) {
          newSuggestions.brand = mostCommonBrand;
        }

        // 建议价格范围
        const prices = categoryItems.map(i => i.price).filter((p): p is number => p !== undefined);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          newSuggestions.price = { min: minPrice, max: maxPrice };
        }

        // 建议标签（最常见的标签）
        const tagCounts: Record<string, number> = {};
        categoryItems.forEach(item => {
          item.tags.forEach(tagId => {
            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
          });
        });
        const suggestedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tagId]) => tagId);
        if (suggestedTags.length > 0) {
          newSuggestions.tags = suggestedTags;
        }
      }
    }

    // 根据名称关键词建议分类
    if (formData.name && !formData.categoryId) {
      const nameLower = formData.name.toLowerCase();
      const matchingCategory = categories.find(cat => {
        const catNameLower = cat.name.toLowerCase();
        return nameLower.includes(catNameLower) || catNameLower.includes(nameLower);
      });
      if (matchingCategory) {
        newSuggestions.category = matchingCategory.id;
      }
    }

    setSuggestions(newSuggestions);
  }, [formData.categoryId, formData.name, items, categories]);

  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [expandedCategoryNodes, setExpandedCategoryNodes] = useState<Set<string>>(new Set());
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // 当分类改变时，自动初始化属性
  useEffect(() => {
    const categoryId = formData.categoryId;
    if (categoryId) {
      const selectedCategory = categories.find(c => c.id === categoryId);
      if (selectedCategory?.attributesTemplate) {
        // 初始化属性，保留已有的属性值，只添加新的属性
        setFormData(prev => {
          const newAttributes = { ...(prev.attributes || {}) };
          Object.keys(selectedCategory.attributesTemplate!).forEach(key => {
            if (!(key in newAttributes)) {
              newAttributes[key] = '';
            }
          });
          return { ...prev, attributes: newAttributes };
        });
      }
    }
  }, [formData.categoryId, categories]);

  // 生成智能建议
  useEffect(() => {
    const newSuggestions: typeof suggestions = {};
    
    // 根据物品名称建议分类
    if (formData.name && !formData.categoryId) {
      const nameLower = formData.name.toLowerCase();
      const categoryKeywords: Record<string, string[]> = {
        '电子产品': ['耳机', '手机', '电脑', '平板', '充电', '数据线', '键盘', '鼠标'],
        '食品': ['米', '面', '油', '盐', '糖', '调料', '零食'],
        '日用品': ['纸巾', '毛巾', '牙刷', '牙膏', '洗发', '沐浴'],
        '服装': ['衣服', '裤子', '鞋子', '帽子', '袜子'],
      };
      
      for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => nameLower.includes(kw))) {
          const matchedCategory = categories.find(c => c.name.includes(categoryName));
          if (matchedCategory) {
            newSuggestions.category = matchedCategory.id;
            break;
          }
        }
      }
    }
    
    // 根据分类建议品牌和价格
    if (formData.categoryId) {
      const categoryItems = items.filter(i => i.categoryId === formData.categoryId);
      if (categoryItems.length > 0) {
        // 建议最常见的品牌
        const brandCounts: Record<string, number> = {};
        categoryItems.forEach(item => {
          if (item.brand) {
            brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
          }
        });
        const mostCommonBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (mostCommonBrand && !formData.brand) {
          newSuggestions.brand = mostCommonBrand;
        }
        
        // 建议价格范围
        const prices = categoryItems.filter(i => i.price).map(i => i.price!);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          newSuggestions.price = {
            min: Math.max(0, Math.floor(avgPrice * 0.7)),
            max: Math.ceil(avgPrice * 1.3),
          };
        }
        
        // 建议常用标签
        const tagCounts: Record<string, number> = {};
        categoryItems.forEach(item => {
          item.tags.forEach(tagId => {
            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
          });
        });
        const commonTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tagId]) => tagId)
          .filter(tagId => !formData.tags?.includes(tagId));
        if (commonTags.length > 0) {
          newSuggestions.tags = commonTags;
        }
      }
    }
    
    setSuggestions(newSuggestions);
  }, [formData.name, formData.categoryId, formData.brand, formData.tags, categories, items]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = '物品名称是必填项';
    }
    if (!formData.storageId) {
      errors.storageId = '请选择收纳位置';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // 如果有错误，切换到包含错误的Tab
      if (validationErrors.name) {
        setActiveTab('basic');
      } else if (validationErrors.storageId) {
        setActiveTab('location');
      }
      return;
    }

    try {
      if (item) {
        await updateItem(item.id, formData);
      } else {
        await addItem(formData as Omit<Item, 'id'>);
      }
      onClose();
    } catch (error) {
      alert('保存失败，请重试');
      console.error('Failed to save item:', error);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim() || !formData.storageId) {
      alert('请填写物品名称和选择收纳位置');
      return;
    }

    try {
      const newItem = await addItem({
        ...formData,
        name: formData.name!,
        storageId: formData.storageId!,
        quantity: formData.quantity || 1,
      } as Omit<Item, 'id'>);
      
      // 快速添加后，切换到完整编辑模式
      setQuickMode(false);
      // 可以在这里设置编辑状态，但需要从外部传入item
      // 暂时关闭弹窗，用户可以再次打开编辑
      onClose();
    } catch (error) {
      alert('保存失败，请重试');
      console.error('Failed to save item:', error);
    }
  };

  const toggleCategoryNode = (id: string) => {
    const newExpanded = new Set(expandedCategoryNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategoryNodes(newExpanded);
  };

  const getRootCategories = () => {
    return categories.filter(c => !c.parentCategoryId);
  };

  const getChildCategories = (parentId: string) => {
    return categories.filter(c => c.parentCategoryId === parentId);
  };

  const getCategoryPath = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    if (!category.parentCategoryId) return category.name;
    return `${getCategoryPath(category.parentCategoryId)} / ${category.name}`;
  };

  const handleToggleTag = (tagId: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tagId)) {
      setFormData({
        ...formData,
        tags: currentTags.filter(t => t !== tagId),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...currentTags, tagId],
      });
    }
  };

  const getTagsByGroup = (groupId: string) => {
    return tags.filter(t => t.tagGroupId === groupId);
  };

  const getTagsWithoutGroup = () => {
    return tags.filter(t => !t.tagGroupId);
  };

  const handleAddAttribute = () => {
    if (newAttrKey.trim() && newAttrValue.trim()) {
      setFormData({
        ...formData,
        attributes: {
          ...(formData.attributes || {}),
          [newAttrKey.trim()]: newAttrValue.trim(),
        },
      });
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...(formData.attributes || {}) };
    delete newAttributes[key];
    setFormData({
      ...formData,
      attributes: newAttributes,
    });
  };

  // 快速添加模式
  if (quickMode) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="glass-modal rounded-xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold">快速添加物品</h2>
              <p className="text-sm text-gray-500 mt-1">填写基本信息，后续可编辑补充</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleQuickSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  placeholder="例如：蓝牙耳机"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  收纳位置 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.storageId}
                  onChange={e => setFormData({ ...formData, storageId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  required
                >
                  <option value="">选择收纳位置</option>
                  {storages.map(storage => (
                    <option key={storage.id} value={storage.id}>
                      {getStoragePath(storage.id)}
                    </option>
                  ))}
                </select>
                {validationErrors.storageId && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.storageId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setQuickMode(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                切换到完整表单
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white text-sm"
              >
                快速添加
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{item ? '编辑物品' : '添加物品'}</h2>
            {!item && (
              <>
                <button
                  type="button"
                  onClick={() => setShowTemplateSelector(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  从模板创建
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!item && (
              <button
                type="button"
                onClick={() => {
                  const templateName = prompt('请输入模板名称：');
                  if (templateName && templateName.trim()) {
                    saveTemplate({
                      name: templateName.trim(),
                      categoryId: formData.categoryId,
                      defaultAttributes: formData.attributes,
                      defaultTags: formData.tags,
                      defaultPrice: formData.price,
                      defaultUnit: formData.unit,
                      defaultBrand: formData.brand,
                      defaultDescription: formData.description,
                    });
                    alert('模板已保存');
                  }
                }}
                className="px-3 py-1.5 text-sm bg-mint-100 hover:bg-mint-200 text-mint-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                保存为模板
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 模板选择器 */}
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="glass-modal rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col m-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">选择模板</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadTemplates().length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg mb-1">还没有模板</p>
                    <p className="text-sm">创建物品后可以保存为模板</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {loadTemplates().map(template => (
                      <div
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-mint-500 hover:bg-mint-50 cursor-pointer transition-colors"
                      >
                        <div className="font-medium text-gray-900 mb-2">{template.name}</div>
                        {template.categoryId && (
                          <div className="text-sm text-gray-500 mb-1">
                            分类: {categories.find(c => c.id === template.categoryId)?.name || '未知'}
                          </div>
                        )}
                        {template.defaultPrice && (
                          <div className="text-sm text-gray-500 mb-1">价格: ¥{template.defaultPrice}</div>
                        )}
                        {template.defaultTags && template.defaultTags.length > 0 && (
                          <div className="text-sm text-gray-500">
                            标签: {template.defaultTags.map(tagId => tags.find(t => t.id === tagId)?.name).filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 border-b border-gray-200">
            <TabsList className="w-full justify-start bg-transparent">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                财务信息
              </TabsTrigger>
              <TabsTrigger value="identifiers" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                标识与图片
              </TabsTrigger>
              <TabsTrigger value="tags-attributes" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                标签与属性
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* 基本信息Tab */}
            <TabsContent value="basic" className="mt-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    物品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                    placeholder="例如：蓝牙耳机"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint resize-none"
                    rows={3}
                    placeholder="物品的详细描述..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    收纳位置 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.storageId}
                    onChange={e => setFormData({ ...formData, storageId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                    required
                  >
                    <option value="">选择收纳位置</option>
                    {storages.map(storage => (
                      <option key={storage.id} value={storage.id}>
                        {getStoragePath(storage.id)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.storageId && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.storageId}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategorySelect(!showCategorySelect)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint text-left bg-white flex items-center justify-between"
                    >
                      <span className={formData.categoryId ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.categoryId ? getCategoryPath(formData.categoryId) : '选择分类'}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCategorySelect && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {getRootCategories().length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">暂无分类</div>
                          ) : (
                            getRootCategories().map(cat => {
                              const renderCategory = (category: typeof cat, level: number = 0) => {
                                const children = getChildCategories(category.id);
                                const isExpanded = expandedCategoryNodes.has(category.id);
                                const isSelected = formData.categoryId === category.id;

                                return (
                                  <div key={category.id}>
                                    <div
                                      className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer ${
                                        isSelected ? 'bg-mint-50 text-mint-700' : ''
                                      }`}
                                      style={{ paddingLeft: `${0.5 + level * 1}rem` }}
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, categoryId: category.id }));
                                        setShowCategorySelect(false);
                                      }}
                                    >
                                      {children.length > 0 ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategoryNode(category.id);
                                          }}
                                          className="p-0.5"
                                        >
                                          {isExpanded ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-4" />
                                      )}
                                      <span className="flex-1 text-sm">{category.name}</span>
                                    </div>
                                    {isExpanded && children.length > 0 && (
                                      <div>
                                        {children.map(child => renderCategory(child, level + 1))}
                                      </div>
                                    )}
                                  </div>
                                );
                              };
                              return renderCategory(cat, 0);
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.categoryId && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, categoryId: undefined }))}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      清除分类
                    </button>
                  )}
                  {suggestions.category && !formData.categoryId && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, categoryId: suggestions.category }))}
                      className="mt-2 px-3 py-1.5 text-sm bg-mint-100 text-mint-700 rounded-lg hover:bg-mint-200 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      建议分类: {categories.find(c => c.id === suggestions.category)?.name}
                    </button>
                  )}
                  {suggestions.category && !formData.categoryId && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, categoryId: suggestions.category }))}
                      className="mt-2 px-3 py-1 text-sm bg-mint-100 text-mint-700 rounded hover:bg-mint-200 transition-colors"
                    >
                      建议分类: {categories.find(c => c.id === suggestions.category)?.name}
                    </button>
                  )}
                </div>

                {/* 数量和库存 */}
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    数量与库存
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                        placeholder="件"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最小阈值</label>
                      <input
                        type="number"
                        value={formData.minThreshold || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            minThreshold: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                        placeholder="补货提醒"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最大阈值</label>
                      <input
                        type="number"
                        value={formData.maxThreshold || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            maxThreshold: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                        placeholder="库存过多提醒"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
              </div>
            </TabsContent>


            {/* 财务信息Tab */}
            <TabsContent value="financial" className="mt-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">购买价格（¥）</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={e =>
                        setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {suggestions.price && !formData.price && (
                      <button
                        type="button"
                        onClick={() => {
                          const avgPrice = (suggestions.price!.min + suggestions.price!.max) / 2;
                          setFormData(prev => ({ ...prev, price: Math.round(avgPrice * 100) / 100 }));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-mint-100 text-mint-700 rounded hover:bg-mint-200 transition-colors"
                      >
                        建议: ¥{suggestions.price.min} - ¥{suggestions.price.max}
                      </button>
                    )}
                  </div>
                </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年折旧率（%）</label>
                  <input
                    type="number"
                    value={formData.depreciationRate || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        depreciationRate: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                    placeholder="例如：20"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">购买日期</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">过期日期</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 标识与图片Tab */}
            <TabsContent value="identifiers" className="mt-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">RFID</label>
                    <input
                      type="text"
                      value={formData.rfid}
                      onChange={e => setFormData({ ...formData, rfid: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                      placeholder="RFID 标签编号"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">条形码</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                      placeholder="条形码编号"
                    />
                  </div>
                </div>

                {/* 图片上传 */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    物品图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      const imageUrls: string[] = [];
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            imageUrls.push(event.target.result as string);
                            if (imageUrls.length === files.length) {
                              setFormData({
                                ...formData,
                                images: [...(formData.images || []), ...imageUrls],
                              });
                            }
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                  />
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`${formData.name} ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = formData.images?.filter((_, i) => i !== index) || [];
                              setFormData({ ...formData, images: newImages });
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                </div>
              </div>
            </TabsContent>

            {/* 标签与属性Tab */}
            <TabsContent value="tags-attributes" className="mt-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 标签 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      标签
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowTagSelect(!showTagSelect)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      选择标签
                    </button>
                  </div>

                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tagId}
                            className="flex items-center gap-1 px-3 py-1 bg-mint-100 text-mint-700 rounded-full text-sm"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleToggleTag(tagId)}
                              className="hover:bg-mint-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {suggestions.tags && suggestions.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-gray-500 self-center">建议标签:</span>
                      {suggestions.tags
                        .filter(tagId => !formData.tags?.includes(tagId))
                        .map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <button
                              key={tagId}
                              type="button"
                              onClick={() => handleToggleTag(tagId)}
                              className="px-3 py-1.5 rounded-lg text-sm bg-mint-50 border border-mint-200 text-mint-700 hover:bg-mint-100 transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {tag.name}
                            </button>
                          );
                        })}
                    </div>
                  )}
                  {suggestions.tags && suggestions.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-gray-500 self-center">建议标签:</span>
                      {suggestions.tags
                        .filter(tagId => !formData.tags?.includes(tagId))
                        .map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <button
                              key={tagId}
                              type="button"
                              onClick={() => handleToggleTag(tagId)}
                              className="px-3 py-1.5 rounded-lg text-sm bg-mint-50 border border-mint-200 text-mint-700 hover:bg-mint-100 transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {tag.name}
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {showTagSelect && (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                      <div className="space-y-4">
                        {/* 按分组显示标签 */}
                        {tagGroups.map(group => {
                          const groupTags = getTagsByGroup(group.id);
                          if (groupTags.length === 0) return null;
                          return (
                            <div key={group.id}>
                              <div className="flex items-center gap-2 mb-2">
                                {group.color && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                )}
                                <h4 className="text-sm font-medium text-gray-700">{group.name}</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {groupTags.map(tag => {
                                  const isSelected = formData.tags?.includes(tag.id);
                                  return (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      onClick={() => handleToggleTag(tag.id)}
                                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        isSelected
                                          ? 'bg-mint-500 text-white'
                                          : 'bg-white border border-gray-300 hover:bg-gray-100'
                                      }`}
                                    >
                                      {tag.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {/* 未分组的标签 */}
                        {getTagsWithoutGroup().length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">未分组</h4>
                            <div className="flex flex-wrap gap-2">
                              {getTagsWithoutGroup().map(tag => {
                                const isSelected = formData.tags?.includes(tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleToggleTag(tag.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                      isSelected
                                        ? 'bg-mint-500 text-white'
                                        : 'bg-white border border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    {tag.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {tags.length === 0 && (
                          <div className="text-center py-4 text-gray-400 text-sm">暂无标签</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 属性 */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    属性
                  </h3>

              {/* 分类属性模板 */}
              {formData.categoryId ? (() => {
                const selectedCategory = categories.find(c => c.id === formData.categoryId);
                if (!selectedCategory) {
                  return (
                    <div className="text-sm text-gray-400 mb-4">
                      正在加载分类信息...（分类ID: {formData.categoryId}）
                    </div>
                  );
                }
                
                const templateAttrs = selectedCategory.attributesTemplate;
                if (!templateAttrs || typeof templateAttrs !== 'object' || Array.isArray(templateAttrs)) {
                  return (
                    <div className="text-sm text-gray-400 mb-4">
                      该分类暂无属性模板
                    </div>
                  );
                }
                
                const templateKeys = Object.keys(templateAttrs);
                
                if (templateKeys.length > 0) {
                  return (
                    <div className="space-y-3 mb-4">
                      <div className="text-sm text-gray-600 font-medium mb-3">
                        分类属性（来自分类模板）
                      </div>
                      {templateKeys.map(key => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {key}
                            {templateAttrs[key] && (
                              <span className="text-xs text-gray-500 ml-2 font-normal">({templateAttrs[key]})</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={formData.attributes?.[key] || ''}
                            onChange={e => {
                              setFormData(prev => ({
                                ...prev,
                                attributes: {
                                  ...(prev.attributes || {}),
                                  [key]: e.target.value,
                                },
                              }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                            placeholder={`请输入${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div className="text-sm text-gray-400 mb-4">
                    该分类暂无属性模板
                  </div>
                );
              })() : (
                <div className="text-sm text-gray-400 mb-4">
                  请先选择分类以显示属性模板
                </div>
              )}

              {/* 自定义属性 */}
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {formData.categoryId ? '额外属性' : '自定义属性'}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttrKey}
                    onChange={e => setNewAttrKey(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                    placeholder="属性名"
                  />
                  <input
                    type="text"
                    value={newAttrValue}
                    onChange={e => setNewAttrValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                    placeholder="属性值"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 显示自定义属性（非模板属性） */}
                {formData.attributes && (() => {
                  const selectedCategory = categories.find(c => c.id === formData.categoryId);
                  const templateKeys = selectedCategory?.attributesTemplate ? Object.keys(selectedCategory.attributesTemplate) : [];
                  const customAttrs = Object.entries(formData.attributes).filter(([key]) => !templateKeys.includes(key));
                  
                  if (customAttrs.length > 0) {
                    return (
                      <div className="space-y-2">
                        {customAttrs.map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <input
                              type="text"
                              value={value}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  attributes: {
                                    ...(prev.attributes || {}),
                                    [key]: e.target.value,
                                  },
                                }));
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none ring-mint"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAttribute(key)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              </div>
              </div>
            </TabsContent>
          </form>

          {/* 底部按钮 */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
            >
              {item ? '保存更改' : '添加物品'}
            </button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
