const datastore = require('./datastore');

/*
 * VALIDATE LOADS AND BOATS
 */
const boat_load = async (req, res, next) => {
    req.body.load = await datastore.getLoad_unprotected(req);
    req.body.boat = await datastore.getBoat(req);
    if (!req.body.boat || !req.body.load) {
        return res.status(404).json({
            "Error": "load with this load_id does not exist and/or boat with this boat_id does not exist"
        });
    } else if (req.method == 'PUT' && req.body.load.carrier.id) {
        return res.status(403).json({
            "Error": "load is already assigned to a boat"
        });
    } else if (req.body.boat && req.body.load) {
        await req.body.boat.loads.push({
            id: req.body.load.id,
        });
        req.body.load.carrier = {
            name: req.body.boat.name,
            id: req.body.boat.id,
        };
    }
    next();
}

/*
 * VALIDATE OWNER OF A LOAD
 */
const load_owner = async (req, res, next) => {
    const load = await datastore.getLoad(req);
    if (!load) {
        return res.status(404).json({
            "Error": "Load with this load_id does not exist"
        });
    } else if (load == '403') {
        return res.status(403).json({
            "Error": "You are not the owner of this load"
        });
    }
    req.params.boat_id = load.carrier.id;
    next();
}

/*
 * CHECK FOR REQUIRED BOAT ATTRIBUTES (post/put boat)
 */
const boat_attr = async (req, res, next) => {
    const boat = {
        name: req.body.name,
        type: req.body.type,
        length: req.body.length,
    };
    if (Object.values(boat).every(param => param != null)) { // valid boat entry
        next();
    } else {
        return res.status(400).json({
            "Error": "At least one of the required attributes is missing"
        });
    }
}

/*
 * CHECK FOR REQUIRED LOAD ATTRIBUTES (post/put load)
 */
const load_attr = async (req, res, next) => {
    const load = {
        volume: req.body.volume,
        content: req.body.content,
    };
    if (Object.values(load).every(param => param != null)) { // valid load entry
        next();
    } else {
        return res.status(400).json({
            "Error": "At least one of the required attributes is missing"
        });
    }
}

/*
 * CHECK CONTENT-TYPE
 */
const headers = async (req, res, next) => {
    if (req.method !== 'GET' && req.get('content-type') !== 'application/json') {
        return res.status(415).json({
            "Error": "Sent media type is not supported"
        })
    } else if (req.get('accept') !== 'application/json') {
        return res.status(406).json({
            "Error": "Requested media type is not supported"
        });
    }
    next();
}

// Custom error handeling for jwt checks
const auth = async (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            "Error": "Invalid bearer authorization token"
        });
    }
    next();
};

module.exports = {
    boat_load,
    load_owner,
    boat_attr,
    headers,
    load_attr,
    auth
}