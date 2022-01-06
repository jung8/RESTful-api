const router = require('express').Router();
const datastore = require('../lib/middleware/datastore');

router.get('/:owner_id/boats', async (req, res) => {
    const boats = await datastore.getOwnerBoats(req.params.owner_id);
    res.status(200).json(boats)
});

module.exports = router;