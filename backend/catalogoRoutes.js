const express = require('express'); 
const router = express.Router(); 
router.all('/*', (req,res) => res.status(501).json({abaixo: 'em_construcao', etapa: 'proxima'})); 
module.exports = router; 
