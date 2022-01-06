const {
    Datastore
} = require('@google-cloud/datastore');
const datastore = new Datastore();
const BOAT = 'boat';
const LOAD = 'load';
const USER = 'user';

// ============================================
// ****************** USERS *******************
// ============================================

/*
 * CREATE A USER IN THE DB
 */
const createUser = async user => {
    const key = datastore.key(USER);
    await datastore.save({
        key: key,
        data: user
    });
    return key;
}

/*
 * GET ALL USERS IN THE DB
 */
const getUsers = async () => {
    const query = datastore.createQuery(USER);
    return await datastore.runQuery(query);
}

/*
 * GET A SINGLE USER IN THE DB
 */
const getUser = async user_sub => {
    const query = datastore.createQuery(USER)
        .filter('user_id', '=', user_sub);
    return (await datastore.runQuery(query))[0][0];
}

/*
 * UPDATE A USER IN THE DB
 */
// const updateUser = async (req, user) => {
//     const key = datastore.key([USER, parseInt(user.id)]);
//     return datastore.update({
//         key: key,
//         data: user
//     }).then(() => {
//         Object.assign(user, {
//             self: `${req.protocol}://${req.get('host')}${req.baseUrl}/${user.id}`
//         });
//         return user;
//     }); 
// }

/*
 * DELETE A USER IN THE DB
 */
// const deleteUser = async (user_id) => {
//     const key = datastore.key([USER, parseInt(user_id)]);
//     return datastore.get(key).then(entity => {
//         if (entity[0]) {
//             return datastore.delete(key); // delete the boat
//         } else {
//             return null;
//         }
//     });
// }

// ============================================
// ****************** BOATS *******************
// ============================================

/*
 * CREATE A BOAT
 */
const createBoat = async boat => {
    const key = datastore.key(BOAT);
    return await datastore.save({
        key: key,
        data: boat,
    }).then(() => {
        return key;
    });
    // return key; // returns the id of the added boat
}

/*
 * GET ALL BOATS
 * provides pagination for 5 items at a time with a cursor for reference.
 */
const getBoats = async (req) => {
    const results = {};
    results.total_boats = await boatCount();
    var query = datastore.createQuery(BOAT).limit(5);
    if (Object.keys(req.query).includes('cursor')) {
        query = query.start(req.query.cursor);
    }
    return datastore.runQuery(query).then((entities) => {
        entities[0].map(entity => { //  add the self prop to loads
            if (entity.loads.length > 0) {
                entity.loads.map(load => load.self = `${req.protocol}://${req.get('host')}/loads/${load.id}`);
            }
        });
        results.boats = entities[0].map(entity => Object.assign(entity, { // add self and ID prop to boats
            id: entity[Datastore.KEY].id,
            self: `${req.protocol}://${req.get('host')}${req.baseUrl}/${entity[Datastore.KEY].id}`,
        }));
        if (entities[1].moreResults !== Datastore.NO_MORE_RESULTS) {
            results.next = `${req.protocol}://${req.get('host')}${req.baseUrl}?cursor=${entities[1].endCursor}`;
        }
        return results;
    });
}

// GET A TOTAL BOAT COUNT
async function boatCount() {
    const boat = (await datastore.runQuery(datastore.createQuery(BOAT)))[0];
    return boat.length
}

// GET BOAT BY NAME
// const uniqueBoat = async (boat_name) => {
//     const query = datastore.createQuery('boat').filter('name', '=', boat_name)
//     var boat = (await datastore.runQuery(query))[0][0];
//     return boat;
// }

/*
 * GET A SINGLE BOAT
 */
const getBoat = async (req) => {
    const query = datastore.createQuery(BOAT)
        .filter('__key__', '=', datastore.key([BOAT, parseInt(req.params.boat_id)]));
    var entity = (await datastore.runQuery(query))[0][0];
    if (entity) {
        if (entity.loads.length > 0) { // add the self prop to loads
            entity.loads.map(load => load.self = `${req.protocol}://${req.get('host')}/loads/${load.id}`);
        }
        entity.id = entity[Datastore.KEY].id;
        entity.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${entity[Datastore.KEY].id}`;
    }
    return entity;
}

/*
 * UPDATE A BOAT
 */
const updateBoat = async (req) => {
    const boat = {
        name: req.body.boat && req.body.boat.name || req.body.name,
        type: req.body.boat && req.body.boat.type || req.body.type,
        length: req.body.boat && req.body.boat.length || req.body.length,
        loads: req.body.boat && req.body.boat.loads || req.body.loads,
        id: null,
    }
    const org_boat = await getBoat(req); // get the boat
    if (!org_boat) {
        return null; // id does not match or bot does not exist
    }
    for (const [key, value] of Object.entries(boat)) {
        if (!value) {
            boat[key] = org_boat[key]
        }
    }
    const key = datastore.key([BOAT, parseInt(boat.id)]);
    return datastore.update({
        key: key,
        data: boat
    }).then(() => {
        boat.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${boat.id}`;
        if (boat.loads.length > 0) {
            boat.loads.map(load => load.self = `${req.protocol}://${req.get('host')}/loads/${load.id}`);
        }
        return boat;
    });
}

/*
 * DELETE A BOAT
 */
const deleteBoat = async (boat_id) => {
    const key = datastore.key([BOAT, parseInt(boat_id)]);
    return datastore.get(key).then(entity => {
        if (entity[0]) {
            return datastore.delete(key); // delete the boat
        } else {
            return null;
        }
    });
}

// ============================================
// ****************** LOADS *******************
// ============================================
// LOADS REQUIRE USER AUTH

/*
 * CREATE A LOAD
 */
const createLoad = req => {
    const load = {
        owner: req.user.sub,
        volume: req.body.volume,
        content: req.body.content,
        last_updated: new Date(Date.now()).toLocaleDateString('en-US'),
        carrier: {},
    };
    key = datastore.key(LOAD);
    return datastore.save({
        key: key,
        data: load,
    }).then(() => {
        load.id = key.id;
        load.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${key.id}`;
        return load; // returns the id of the added load
    });
}

/*
 * GET ALL LOADS (belonging to a specific user)
 * provides pagination for 5 items at a time with a cursor for reference.
 */
const getLoads = async (req) => {
    const results = {};
    results.load_count = await loadCount(req.user.sub)
    var query = datastore.createQuery(LOAD).limit(5)
        .filter('owner', '=', req.user.sub);
    if (Object.keys(req.query).includes('cursor')) {
        query = query.start(req.query.cursor);
    }
    return datastore.runQuery(query).then((entities) => {
        entities[0].map(entity => { // add the self prop to loads
            if (entity.carrier.id) {
                entity.carrier.self = `${req.protocol}://${req.get('host')}/boats/${entity.carrier.id}`;
            }
        });
        results.loads = entities[0].map(entity => Object.assign(entity, { // add the self and ID props
            id: entity[Datastore.KEY].id,
            self: `${req.protocol}://${req.get('host')}${req.baseUrl}/${entity[Datastore.KEY].id}`
        }));
        if (entities[1].moreResults !== Datastore.NO_MORE_RESULTS) {
            results.next = `${req.protocol}://${req.get('host')}${req.baseUrl}?cursor=${entities[1].endCursor}`;
        }
        return results;
    });
}

async function loadCount(owner) {
    const loads = (await datastore.runQuery(datastore.createQuery(LOAD).filter('owner', '=', owner)))[0];
    return loads.length
}

/*
 * GET A SINGLE LOAD
 */
const getLoad = async (req) => {
    const load_id = req.params.load_id || req.body.load.id
    const owner = req.user && req.user.sub || req.body.load.owner
    const query = datastore.createQuery(LOAD)
        .filter('__key__', '=', datastore.key([LOAD, parseInt(load_id)]));
    var entity = (await datastore.runQuery(query))[0][0];
    if (entity && entity.owner == owner) { // add the ID and self prop
        entity.id = entity[Datastore.KEY].id;
        entity.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${entity[Datastore.KEY].id}`
        if (entity.carrier.id) { // add self prop to the carrier
            entity.carrier.self = `${req.protocol}://${req.get('host')}/boats/${entity.carrier.id}`;
        }
        return entity;
    } else if (entity) {
        return '403';
    } else {
        return null;
    }
}

/*
 * GET A SINGLE LOAD (unprotected)
 */
const getLoad_unprotected = async (req) => {
    const load_id = req.params.load_id;
    const query = datastore.createQuery(LOAD)
        .filter('__key__', '=', datastore.key([LOAD, parseInt(load_id)]));
    var entity = (await datastore.runQuery(query))[0][0];
    return entity;
}

/*
 * UPDATE A LOAD
 */
const updateLoad = async (req) => {
    const load = {
        id: null,
        last_updated: new Date(Date.now()).toLocaleDateString('en-US'),
        owner: req.user && req.user.sub || req.body.load && req.body.load.owner,
        volume: req.body.volume || req.body.load && req.body.load.volume,
        content: req.body.content || req.body.load && req.body.load.content,
        carrier: req.body.carrier || req.body.load && req.body.load.carrier
    };
    const org_load = await getLoad(req); // get the load
    if (!org_load) {
        // console.log("no load")
        return null; // not the owner 
    } else if (org_load == '403') { // load does not exist
        return '403';
    }
    for (const [key, value] of Object.entries(load)) {
        if (!value) {
            load[key] = org_load[key]
        }
    }

    const key = datastore.key([LOAD, parseInt(load.id)]);
    return datastore.update({
        key: key,
        data: load
    }).then(() => {
        load.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${load.id}`;
        return load;
    });
}

/*
 * DELETE A LOAD
 */
const deleteLoad = async (load_id) => {
    const key = datastore.key([LOAD, parseInt(load_id)]);
    return datastore.get(key).then(entity => {
        // console.log(entity)
        if (entity[0]) {
            return datastore.delete(key); // delete the boat
        } else {
            return null;
        }
    });
}

// ============================================
// ************** LOADS & BOATS ***************
// ============================================

/*
 * ADD A LOAD TO A BOAT
 */
const add_load_to_boat = async (req) => {
    const load = await updateLoad(req); // update the load
    if (load && load.carrier.id) {
        return await updateBoat(req); // update the boat
    } else {
        return null; // load already assigned to a boat
    }
}

/*
 * ADD A LOAD TO A BOAT
 */
const remove_load_from_boat = async (req) => {
    await removeLoad(req); // remove the load from the boat
    // remove boat from the load
    const load = await getLoad_unprotected(req);
    load.carrier = {}; // remove the carrier
    const key = datastore.key([LOAD, parseInt(req.params.load_id)]);
    return datastore.update({
        key: key,
        data: load
    }).then(() => {
        return load;
    });
}

/*
 * REMOVE A LOAD ON A BOAT
 */
const removeLoad = async (req) => {
    const boat = await getBoat(req); // get the boat
    if (!boat) {
        return null; // id does not match or boat does not exist
    }
    boat.loads = boat.loads.filter(({ // remove the load (load is assigned to this boat)
        id
    }) => id != req.params.load_id);
    req.body.boat = boat
    return updateBoat(req); // update the boat in the database
}

/*
 * UNLOAD ALL LOADS ON A BOAT
 */
const unloadBoat = async (req) => {
    // get all loads that match carrier id
    var query = datastore.createQuery(LOAD)
        .filter('carrier.id', '=', req.params.boat_id);
    var loads = (await datastore.runQuery(query))[0];
    loads.forEach(load => {
        req.body.load = load
        req.body.load.carrier = {}
        updateLoad(req)
    })
}


module.exports = {
    createUser,
    getUsers,
    getUser,
    createBoat,
    getBoats,
    getBoat,
    updateBoat,
    deleteBoat,
    createLoad,
    getLoads,
    getLoad,
    updateLoad,
    deleteLoad,
    add_load_to_boat,
    removeLoad,
    unloadBoat,
    remove_load_from_boat,
    getLoad_unprotected
}