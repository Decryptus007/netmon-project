const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CredentialService = require('../services/credentialService');

// Validation middleware
const validateCredential = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['ssh', 'network', 'cloud', 'vault']).withMessage('Invalid credential type'),
  body('username').trim().notEmpty().withMessage('Username is required'),
];

// Get all credentials
router.get('/', async (req, res, next) => {
  try {
    const credentials = await CredentialService.getAllCredentials();
    res.json(credentials);
  } catch (error) {
    next(error);
  }
});

// Get credential by ID
router.get('/:id', async (req, res, next) => {
  try {
    const credential = await CredentialService.getCredential(req.params.id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    res.json(credential);
  } catch (error) {
    next(error);
  }
});

// Create new credential
router.post('/', validateCredential, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await CredentialService.createCredential(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Update credential
router.put('/:id', validateCredential, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await CredentialService.updateCredential(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete credential
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await CredentialService.deleteCredential(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 