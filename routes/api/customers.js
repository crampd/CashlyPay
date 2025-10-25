const express = require('express');
const {
  index,
  show,
  store,
  updateTags,
} = require('../../controllers/customer-controller');

const router = express.Router();

router.get('/', index);
router.post('/', store);
router.get('/:customerId', show);
router.put('/:customerId/tags', updateTags);

module.exports = router;
