const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, companyController.createCompany);
router.get('/', authMiddleware, companyController.getCompanies);
router.get('/:id', authMiddleware, companyController.getCompanyById);
router.put('/:id', authMiddleware, companyController.updateCompany);
router.delete('/:id', authMiddleware, companyController.deleteCompany);

module.exports = router;
