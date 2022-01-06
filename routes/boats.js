const router = require('express').Router();
const auth = require('../lib/middleware/auth');
const datastore = require('../lib/middleware/datastore');
const valid = require('../lib/middleware/validate');

/*
 * CREATE A BOAT
 */
router.post('/', valid.headers, valid.boat_attr, (req, res) => {
    const boat = {
        name: req.body.name,
        type: req.body.type,
        length: req.body.length,
        loads: []
    }
    for (const [key, value] of Object.entries(boat)) {
        if (!value) {
            return res.status(400).send("missing attributes");
        }
    }
    datastore.createBoat(boat).then(key => {
        boat.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${key.id}`;
        res.location(`${req.protocol}://${req.get('host')}${req.baseUrl}/${key.id}`);
        boat.id = key.id;
        return res.status(201).json(boat);
    });
});

/*
 * GET ALL BOATS (with matching sub property)
 */
router.get('/', valid.headers, async (req, res) => {
    const boats = await datastore.getBoats(req);
    return res.status(200).json(boats)
});

/*
 * GET A BOAT
 */
router.get('/:boat_id', valid.headers, async (req, res) => {
    const boat = await datastore.getBoat(req);
    if (!boat) {
        return res.status(404).json({
            "Error": "No boat with this boat_id exsists."
        });
    }
    return res.status(200).json(boat);
});

/*
 * UPDATE AN EXISTING BOAT
 */
router.patch('/:boat_id', valid.headers, async (req, res) => {
    const update = await datastore.updateBoat(req); // update the boat
    if (!update) {
        return res.status(404).json({
            "Error": "No boat with this boat_id exsists."
        });
    }
    // return different update values for diff errors
    return res.status(200).json(update);
});

/*
 * REPLACE A BOAT
 */
router.put('/:boat_id', valid.headers, valid.boat_attr, async (req, res) => {
    // middleware to check the props
    const update = await datastore.updateBoat(req); // update the boat
    if (!update) {
        return res.status(404).json({
            "Error": "No boat with this boat_id exsists"
        });
    }
    // return different update values for diff errors
    return res.status(200).json(update);
});

/*
 * DELETE A BOAT
 */
router.delete('/:boat_id', async (req, res) => {
    await datastore.unloadBoat(req);
    const result = await datastore.deleteBoat(req.params.boat_id);
    if (result && result[0].indexUpdates > 0) {
        return res.sendStatus(204);
    } else {
        return res.status(404).json({
            "Error": "No boat with this boat_id exists"
        });
    }
});

// ============================================
// ******** BOATS & LOADS INTERACTIONS ********
// ============================================

/*
 * ADD A LOAD TO A BOAT
 */
router.put('/:boat_id/loads/:load_id', valid.boat_load, async (req, res) => {
    await datastore.add_load_to_boat(req);
    return res.sendStatus(204);
});

/*
 * REMOVE A LOAD FROM A BOAT
 */
router.delete('/:boat_id/loads/:load_id', valid.boat_load, async (req, res) => {
    await datastore.remove_load_from_boat(req);
    return res.sendStatus(204);
});

/*
 * GET NOT SUPPORTED
 */
router.get('/:boat_id/loads/:load_id', (req, res) => {
    return res.status(405).json({
        "Error": "Method not supported"
    });
});

/*
 * GET ALL NOT SUPPORTED
 */
router.get('/:boat_id/loads', (req, res) => {
    return res.status(405).json({
        "Error": "Method not supported"
    });
});

/*
 * PATCH NOT SUPPORTED
 */
router.patch('/:boat_id/loads/:load_id', (req, res) => {
    return res.status(405).json({
        "Error": "Method not supported"
    });
});

/*
 * POST NOT SUPPORTED
 */
router.post('/:boat_id/loads', (req, res) => {
    return res.status(405).json({
        "Error": "Method not supported"
    });
});



module.exports = router;