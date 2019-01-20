var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.render('index', {
      title: '스타우터',
      user: req.user
    });
  } else {
    res.render('index', { title: '스타우터', user: undefined });
  }
});

module.exports = router;
