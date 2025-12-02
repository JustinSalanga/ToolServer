const express = require('express');
const { 
    getBlockListItems, 
    getBlockListItem, 
    createBlockListItem, 
    updateBlockListItem, 
    deleteBlockListItem 
} = require('../controllers/block-list.controller');
const router = express.Router();

// All block list routes require authentication (you can adjust this based on your needs)
router.route('/')
    .get(getBlockListItems)
    .post(createBlockListItem);

router.route('/:id')
    .get(getBlockListItem)
    .put(updateBlockListItem)
    .delete(deleteBlockListItem);

module.exports = router;

