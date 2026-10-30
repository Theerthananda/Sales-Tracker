const express = require('express');
const { authMiddleware, adminMiddleware, limiter } = require('../middleware/authMiddleware');
const { 
  createExpense, 
  getSalespersonExpenses, 
  getAllExpenses, 
  updateExpenseStatus, 
  getExpenseStats, 
  deleteExpense,
  notifyPendingExpense,
  exportToExcel,
  upload 
} = require('../controllers/expenseController');

const router = express.Router();

// Salesperson routes
router.post('/', authMiddleware, limiter, upload.array('billPhoto', 5), createExpense);
router.get('/my-expenses', authMiddleware, limiter, getSalespersonExpenses);
router.post('/:id/notify-pending', authMiddleware, limiter, notifyPendingExpense);
router.delete('/:id', authMiddleware, limiter, deleteExpense);

// Admin routes
router.get('/all', authMiddleware, adminMiddleware, limiter, getAllExpenses);
router.patch('/:id/status', authMiddleware, adminMiddleware, limiter, updateExpenseStatus);
router.get('/stats', authMiddleware, adminMiddleware, limiter, getExpenseStats);
router.get('/export', authMiddleware, adminMiddleware, limiter, exportToExcel);

module.exports = router;
