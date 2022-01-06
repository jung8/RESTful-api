const router = require('express').Router();
const auth = require('../lib/middleware/auth');
const datastore = require('../lib/middleware/datastore');
const valid = require('../lib/middleware/validate');

/*
 * CREATE A NEW LOAD
 */
router.post('/', auth.jwt, valid.auth, valid.headers, valid.load_attr, async (req, res) => {
    // Valid load entry
    datastore.createLoad(req).then(load => {
        return res.status(201).json(load);
    });
});

/*
 * GET ALL LOADS (only matching owner)
 */
router.get('/', auth.jwt, valid.auth, valid.headers, async (req, res) => {
    const loads = await datastore.getLoads(req);
    return res.status(200).json(loads)
});

/*
 * GET A LOAD
 */
router.get('/:load_id', auth.jwt, valid.auth, valid.headers, valid.load_owner, async (req, res) => {
    const load = await datastore.getLoad(req);
    return res.status(200).json(load);
});

/*
 * UPDATE A LOAD
 */
router.patch('/:load_id', auth.jwt, valid.auth, valid.headers, valid.load_owner, async (req, res) => {
    // add check for at leas one attribute
    const update = await datastore.updateLoad(req); // update the load
    return res.status(200).json(update);
});

/*
 * REPLACE A LOAD
 */
router.put('/:load_id', auth.jwt, valid.auth, valid.headers, valid.load_owner, valid.load_attr, async (req, res) => {
    // add a check for all required attributes
    const update = await datastore.updateLoad(req); // update the load
    return res.status(200).json(update);
});

/*
 * DELETE A LOAD
 */
router.delete('/:load_id', auth.jwt, valid.auth, valid.load_owner, async (req, res) => {
    // remove load from the boat first
    if (req.params.boat_id) {
        await datastore.removeLoad(req);
    }
    const result = await datastore.deleteLoad(req.params.load_id);
    if (result && result[0].indexUpdates > 0) {
        return res.sendStatus(204);
    }
});

module.exports = router;