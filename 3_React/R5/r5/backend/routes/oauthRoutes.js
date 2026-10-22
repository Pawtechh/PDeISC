const router = require('express').Router();
const oauth = require('../controllers/oauthController');

router.get('/providers', oauth.providers);
router.get('/:provider', oauth.start);
router.get('/:provider/callback', oauth.callback);

module.exports = router;
