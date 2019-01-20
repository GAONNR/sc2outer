var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json('스타우터');
});

router.get('/:userId', function(req, res, next) {
  res.render('user', { userId: req.params.userId });
});

module.exports = router;
