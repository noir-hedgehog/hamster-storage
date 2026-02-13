# 测试文档

## 前端测试

### 运行测试

```bash
cd Frontend
npm test
```

### 运行测试UI

```bash
npm run test:ui
```

### 运行测试覆盖率

```bash
npm run test:coverage
```

### 测试结构

```
Frontend/src/test/
├── setup.ts              # 测试配置
├── services/
│   └── api.test.ts       # API服务测试
└── components/
    └── LoadingSpinner.test.tsx  # 组件测试
```

### 测试示例

#### API服务测试
- 测试API客户端的所有方法
- 测试错误处理
- 测试请求参数

#### 组件测试
- 测试组件渲染
- 测试用户交互
- 测试响应式行为

## 后端测试

### 运行测试

```bash
cd Backend
npm test
```

### 运行测试UI

```bash
npm run test:ui
```

### 运行测试覆盖率

```bash
npm run test:coverage
```

### 测试结构

```
Backend/src/test/
├── setup.ts                    # 测试配置
├── models/
│   └── LocationModel.test.ts   # 模型单元测试
└── integration/
    └── api.test.ts             # API集成测试
```

### 测试类型

#### 单元测试
- **模型测试**: 测试数据模型的CRUD操作
- **工具函数测试**: 测试辅助函数

#### 集成测试
- **API端点测试**: 测试完整的HTTP请求/响应流程
- **数据库集成**: 测试数据库操作

### 测试示例

#### 模型测试
```typescript
describe('LocationModel', () => {
  it('should create a new location', () => {
    const location = LocationModel.create({ name: '测试地点' });
    expect(location).toBeDefined();
    expect(location.name).toBe('测试地点');
  });
});
```

#### API集成测试
```typescript
describe('Locations API', () => {
  it('should create a location', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .send({ name: '测试地点' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

## 测试最佳实践

1. **隔离测试**: 每个测试应该独立运行，不依赖其他测试
2. **清理数据**: 测试前后清理测试数据
3. **Mock外部依赖**: 使用Mock避免真实API调用
4. **测试边界情况**: 测试正常流程和错误情况
5. **保持测试简单**: 每个测试只测试一个功能点

## 持续集成

可以在CI/CD流程中运行测试：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: |
    cd Frontend && npm test
    cd ../Backend && npm test
```
