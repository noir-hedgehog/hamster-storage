import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { importMovingItems, listMovingItems, normalizeCandidates, parseInput, previewItems } from '../services/moving';

const router = Router();
router.get('/items', (_req, res) => res.json({items: listMovingItems()}));
router.get('/import/batches', (_req, res) => res.json({batches: db.prepare('SELECT id,imported_count,skipped_count,created_at FROM import_batches ORDER BY created_at DESC LIMIT 50').all()}));
router.post(['/import', '/import/preview', '/items'], (req, res, next) => {
  try {
    const body = z.object({input: z.string().max(100000).optional(), items: z.unknown().optional()}).passthrough().parse(req.body);
    const candidates = req.path === '/items' ? normalizeCandidates([body]) : body.items !== undefined ? normalizeCandidates(body.items) : parseInput(body.input || '');
    if (req.path === '/import/preview') { res.json({items: previewItems(candidates)}); return; }
    const result = importMovingItems(candidates, body.input || JSON.stringify(candidates), req.path === '/items' ? 'manual' : 'conversation');
    if (req.path === '/items') {
      if (!result.importedCount) { res.status(409).json({error:'同名、同位置、同品牌的物品已存在'}); return; }
      const row = listMovingItems().find(item => item.name === candidates[0].name && item.location === candidates[0].location && item.brand === candidates[0].brand);
      res.status(201).json({item: row}); return;
    }
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      res.status(400).json({error:'清单格式有误：请检查名称、正整数数量、非负价格和日期；每批最多 500 条。'}); return;
    }
    next(error);
  }
});
export default router;
