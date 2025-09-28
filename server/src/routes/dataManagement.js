const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateDataStore = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['elasticsearch', 'clickhouse', 'prometheus', 'tracix']).withMessage('Invalid data store type'),
  body('host').trim().notEmpty().withMessage('Host is required'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port number required'),
];

// Get data store configuration
router.get('/config', async (req, res, next) => {
  try {
    // TODO: Implement data store configuration retrieval
    res.json({
      configured: false,
      store: null
    });
  } catch (error) {
    next(error);
  }
});

// Configure data store
router.post('/config', validateDataStore, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // TODO: Implement data store configuration
    res.status(201).json({
      message: 'Data store configured successfully',
      configured: true,
      store: {
        name: req.body.name,
        type: req.body.type,
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        apiKey: req.body.apiKey ? '********' : undefined
      }
    });
  } catch (error) {
    next(error);
  }
});

// Remove data store configuration
router.delete('/config', async (req, res, next) => {
  try {
    // TODO: Implement data store configuration removal
    res.json({
      message: 'Data store configuration removed successfully',
      configured: false
    });
  } catch (error) {
    next(error);
  }
});

// Test data store connection
router.post('/test-connection', validateDataStore, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // TODO: Implement connection testing logic
    res.json({
      success: true,
      message: 'Connection test successful'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 