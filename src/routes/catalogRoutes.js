import express from 'express';
import { getCatalog, getCatalogItemById } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/', getCatalog);
router.get('/:id', getCatalogItemById);

export default router;
