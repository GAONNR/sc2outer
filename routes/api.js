var express = require('express');
var request = require('request');
var axios = require('axios');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json('스타우터 API');
});

router.get('/:userId', function(req, res, next) {
  var accessToken;
  var resJson = {
    profileId: undefined,
    name: undefined,
    terran: {
      mmr: undefined,
      wins: undefined,
      losses: undefined,
      tier: undefined
    },
    protoss: {
      mmr: undefined,
      wins: undefined,
      losses: undefined,
      tier: undefined
    },
    zerg: {
      mmr: undefined,
      wins: undefined,
      losses: undefined,
      tier: undefined
    },
    random: {
      mmr: undefined,
      wins: undefined,
      losses: undefined,
      tier: undefined
    }
  };
  var leagueToTier = {};
  var ladderIds = [];

  var getAccount = postRes => {
    accessToken = postRes.data.access_token;
    return axios.get(
      `https://kr.api.blizzard.com/sc2/player/${req.params.userId}`,
      {
        params: {
          access_token: accessToken
        }
      }
    );
  };

  var getLadderSummary = accounts => {
    accounts.data.forEach((val, idx) => {
      if (val.regionId == 3) {
        resJson.profileId = val.profileId;
        resJson.name = val.name;
      }
    });
    // resJson.profileId = 3285450;
    // resJson.profileId = 2455037;
    return axios.get(
      `https://kr.api.blizzard.com/sc2/profile/3/1/${
        resJson.profileId
      }/ladder/summary`,
      {
        params: {
          locale: 'ko_KR',
          access_token: accessToken
        }
      }
    );
  };

  var getLadder = ladderSummary => {
    ladderSummary.data.allLadderMemberships.forEach((val, idx) => {
      if (val.localizedGameMode.includes('1v1')) {
        ladderIds.push(val.ladderId);
        leagueToTier[val.ladderId] = val.localizedGameMode;
      }
    });
    // console.log(ladderIds);
    return Promise.all(
      ladderIds.map(ladderId => {
        return axios.get(
          `https://kr.api.blizzard.com/sc2/profile/3/1/${
            resJson.profileId
          }/ladder/${ladderId}`,
          {
            params: {
              locale: 'ko_KR',
              access_token: accessToken
            }
          }
        );
      })
    );
  };

  var getMMRs = ladders => {
    ladders.forEach((ladder, ladderIdx) => {
      var teams = ladder.data.ladderTeams;
      teams.forEach((member, idx) => {
        if (member.teamMembers[0].id == resJson.profileId) {
          var favoriteRace = member.teamMembers[0].favoriteRace;
          if (!favoriteRace) return;
          if (!member.mmr) return;

          resJson[favoriteRace].tier = leagueToTier[ladderIds[ladderIdx]];
          resJson[favoriteRace].mmr = member.mmr;
          resJson[favoriteRace].wins = member.wins;
          resJson[favoriteRace].losses = member.losses;
        }
      });
    });
    res.json(resJson);
  };

  axios({
    method: 'POST',
    url: 'https://us.battle.net/oauth/token',
    data: 'grant_type=client_credentials',
    auth: {
      username: req.BNET.ID,
      password: req.BNET.SECRET
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(getAccount)
    .then(getLadderSummary)
    .then(getLadder)
    .then(getMMRs)
    .catch(err => {
      res.json(resJson);
    });
});

module.exports = router;
