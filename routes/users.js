var router = require('express').Router();
const {
  Datastore
} = require('@google-cloud/datastore');
var secured = require('../lib/middleware/secured');
const datastore = require('../lib/middleware/datastore');

/* GET user profile. */
router.get('/user', secured(), async function (req, res, next) {
  const data = req.user._json;
  // check gcloud datastore if user already exsists
  var user = await datastore.getUser(data.sub);
  // add to the gcloud datastore if user does not exsist
  if (!user) {
    user = {
      user_id: data.sub,
      given_name: data.given_name,
      family_name: data.family_name,
      email: data.email,
      date_created: new Date(data.updated_at).toLocaleDateString('en-US')
    }
    const result = await datastore.createUser(user);
    // console.log(result)
  }
  var payload = {};
  payload.jwt = req.user.jwt;
  payload.user_id = data.sub;
  res.render('user', payload);
});

/* GET all user profiles */
router.get('/users', async (req, res) => {
  const users = await datastore.getUsers();
  return res.status(200).send(users[0]);
});

/* DELETE a User */
router.delete('/users/:user_id', async (req, res) => {
  const user = await datastore.getUser(req.params.user_id);
  if (!user) {
    return res.status(400).send('No user with that id exists.');
  }
  return datastore.deleteUser(user[Datastore.KEY].id).then(() => {
    return res.sendStatus(204);
  });
});

module.exports = router;