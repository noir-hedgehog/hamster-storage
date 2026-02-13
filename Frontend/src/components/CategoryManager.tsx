import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Category } from '../types';
import { X, Plus, ChevronRight, ChevronDown, Folder, FolderOpen, Edit2, Trash2, Key } from 'lucide-react';

interface CategoryManagerProps {
  onClose: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useStorage();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({ name: '', icon: '', description: '' });
  const [attributesTemplate, setAttributesTemplate] = useState<Array<{ key: string; value: string }>>([]);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getRootCategories = () => {
    return categories.filter(c => !c.parentCategoryId);
  };

  const getChildCategories = (parentId: string) => {
    return categories.filter(c => c.parentCategoryId === parentId);
  };

  const handleAdd = () => {
    setFormData({ name: '', icon: '', description: '' });
    setParentCategoryId(undefined);
    setAttributesTemplate([]);
    setShowAddModal(true);
  };

  const handleAddChild = (parentId: string) => {
    setFormData({ name: '', icon: '', description: '' });
    setParentCategoryId(parentId);
    setAttributesTemplate([]);
    setShowAddModal(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
    });
    setParentCategoryId(category.parentCategoryId);
    // 将属性模板转换为数组格式
    if (category.attributesTemplate) {
      setAttributesTemplate(
        Object.entries(category.attributesTemplate).map(([key, value]) => ({ key, value }))
      );
    } else {
      setAttributesTemplate([]);
    }
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个分类吗？删除后该分类下的子分类和物品将无法使用此分类。')) {
      try {
        await deleteCategory(id);
      } catch (error: any) {
        alert(error.message || '删除失败，请重试');
      }
    }
  };

  const handleAddAttribute = () => {
    if (newAttrKey.trim() && !attributesTemplate.some(attr => attr.key === newAttrKey.trim())) {
      setAttributesTemplate([...attributesTemplate, { key: newAttrKey.trim(), value: newAttrValue.trim() || '文本' }]);
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributesTemplate(attributesTemplate.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    try {
      // 将属性模板数组转换为对象
      const templateObj: Record<string, string> = {};
      attributesTemplate.forEach(attr => {
        if (attr.key.trim()) {
          templateObj[attr.key.trim()] = attr.value.trim() || '文本';
        }
      });

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          parentCategoryId,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
          attributesTemplate: Object.keys(templateObj).length > 0 ? templateObj : undefined,
        });
      } else {
        await addCategory({
          name: formData.name,
          parentCategoryId,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
          attributesTemplate: Object.keys(templateObj).length > 0 ? templateObj : undefined,
        });
      }
      setShowAddModal(false);
      setEditingCategory(null);
      setFormData({ name: '', icon: '', description: '' });
      setAttributesTemplate([]);
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildCategories(category.id);
    const isExpanded = expandedNodes.has(category.id);

    return (
      <div key={category.id} className="mb-1">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
          style={{ paddingLeft: `${0.5 + level * 1}rem` }}
        >
          {children.length > 0 ? (
            <button
              onClick={() => toggleNode(category.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-mint-500" />
          ) : (
            <Folder className="w-4 h-4 text-gray-500" />
          )}
          <span className="flex-1 text-sm">{category.name}</span>
          {category.attributesTemplate && Object.keys(category.attributesTemplate).length > 0 && (
            <span className="text-xs text-mint-600 flex items-center gap-1" title={`属性模板：${Object.keys(category.attributesTemplate).join(', ')}`}>
              <Key className="w-3 h-3" />
            </span>
          )}
          <button
            onClick={() => handleAddChild(category.id)}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="添加子分类"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => handleEdit(category)}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5 text-mint-600" />
          </button>
          <button
            onClick={() => handleDelete(category.id)}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
        {isExpanded && children.length > 0 && (
          <div className="mt-1">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col glass">
        {/* 头部 */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">分类管理</h2>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 btn-mint rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加分类
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {getRootCategories().length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>还没有分类</p>
                <p className="text-sm mt-2">点击"添加分类"开始创建</p>
              </div>
            ) : (
              <div>
                {getRootCategories().map(category => renderCategory(category, 0))}
              </div>
            )}
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editingCategory ? '编辑分类' : '添加分类'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', icon: '', description: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：电子产品、食品、衣物"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  父分类
                </label>
                <select
                  value={parentCategoryId || ''}
                  onChange={e => setParentCategoryId(e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                >
                  <option value="">无（顶级分类）</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标（可选）
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="图标名称或 emoji"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="分类描述"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint resize-none"
                />
              </div>

              {/* 属性模板 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  属性模板（可选）
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  定义该分类下物品的属性模板，选择此分类的物品会自动初始化这些属性
                </p>
                <div className="space-y-2 mb-3">
                  {attributesTemplate.map((attr, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attr.key}
                        onChange={e => {
                          const newTemplate = [...attributesTemplate];
                          newTemplate[index].key = e.target.value;
                          setAttributesTemplate(newTemplate);
                        }}
                        placeholder="属性名（如：酒精度）"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={e => {
                          const newTemplate = [...attributesTemplate];
                          newTemplate[index].value = e.target.value;
                          setAttributesTemplate(newTemplate);
                        }}
                        placeholder="类型/描述（如：数字、文本）"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttrKey}
                    onChange={e => setNewAttrKey(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddAttribute()}
                    placeholder="属性名"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  />
                  <input
                    type="text"
                    value={newAttrValue}
                    onChange={e => setNewAttrValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddAttribute()}
                    placeholder="类型/描述"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:outline-none ring-mint"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', icon: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 btn-mint rounded-lg text-white"
              >
                {editingCategory ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
