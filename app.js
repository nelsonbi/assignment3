const express = require('express');
const app = express();
app.set('trust proxy', true);

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const BOATS = "Boats";
const SLIPS = "Slips"

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

function appendSelf(array, url){
    for (var i = 0; i < array.length; i++){
        array[i].self = url + array[i].id
    }
    return array;
}

/* ------------- Begin Lodging Model Functions -> Boats ------------- */
function post_boat(name, type, length) {
    var key = datastore.key(BOATS);
    const new_boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { 
        new_boat.id = key.id
        return new_boat 
    });
}

/**
 * The function datastore.query returns an array, where the element at index 0
 * is itself an array. Each element in the array at element 0 is a JSON object
 * with an entity fromt the type "Lodging".
 */
function get_boats() {
    const q = datastore.createQuery(BOATS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

/**
 * This function is not in the code discussed in the video. It demonstrates how
 * to get a single entity from Datastore using an id.
 * Note that datastore.get returns an array where each element is a JSON object 
 * corresponding to an entity of the Type "Lodging." If there are no entities
 * in the result, then the 0th element is undefined.
 * @param {number} id Int ID value
 * @returns An array of length 1.
 *      If a lodging with the provided id exists, then the element in the array
 *           is that lodging
 *      If no lodging with the provided id exists, then the value of the 
 *          element is undefined
 */
function get_boat(id) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        //console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function patch_boat(id, data) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            console.log("we are iffing " + entity);
            return entity[0];
        } else {
            const patch_boat = { "name": data.name, "type": data.type, "length": data.length };
            return datastore.update({ "key": key, "data": patch_boat }).then(() => { 
            patch_boat.id = key.id
            console.log(patch_boat)
            return patch_boat 
            });             
        };
    });
};

function put_boat(id, name, type, length) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}

function delete_boat(id) {    
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            console.log("we are iffing " + entity);
            return entity[0];
        } else {
            return datastore.delete(key);          
        };
    });
}

/* ------------- End Model Functions -> Boats ------------- */

/* ------------- Begin Lodging Model Functions -> Slips ------------- */

function post_slip(number) {
    var key = datastore.key(SLIPS);
    const new_slip = { "number": number, "current_boat": null};
    return datastore.save({ "key": key, "data": new_slip }).then(() => { 
        new_slip.id = key.id
        //console.log("post_slip: " + new_slip)
        return new_slip 
    });
}

function get_slip(id) {
    const key = datastore.key([SLIPS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        //console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function get_slips() {
    const q = datastore.createQuery(SLIPS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

function delete_slip(id) {    
    const key = datastore.key([SLIPS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            console.log("we are iffing " + entity);
            return entity[0];
        } else {
            return datastore.delete(key);          
        };
    });
}

function slip_parkingEnter(slip_id, boat_id) {
    console.log("in parking");
    return get_slip(slip_id).then((slip) => {
        console.log("located in number 1")
        if (slip[0] === undefined ){
            console.log("located in number 2")
            return slip[0]
        }
        else if(slip[0].current_boat !== null){
            console.log("located in number 3")
            return "Occupied"
        }
        else{
            console.log("located in number 4")
            return get_boat(boat_id).then((boat) => {
                if (boat[0]=== undefined || boat[0] === null){
                    console.log("The boat does not exist");
                    return boat[0];
                }
                else {
                    console.log("located in number 5")
                    const key = datastore.key([SLIPS, parseInt(slip[0].id, 10)]);
                    data = {"current_boat": boat[0].id, "number": slip[0].number}
                    datastore.save({"key": key, "data": data });
                    return "Available"
                }
            });
        }
    });
}

function depart_slip(slip_id, boat_id) {
    console.log("DEPARTING IN 5 4 3 2 1...");
    return get_slip(slip_id).then((slip) => {
        console.log(boat_id)
        console.log("located in number 1")
        if (slip[0] === undefined ){
            console.log("located in number 2 - THE SLIP DOES NOT EXIST")
            return slip[0]
        }
        else if(slip[0].current_boat !== boat_id){
            console.log("located in number 3 - THE WRONG BOAT IS TRYING TO LEAVE")
            return "Occupied"
        }
        else{
            console.log("located in number 4")
            return get_boat(boat_id).then((boat) => {
                if (boat[0]=== undefined || boat[0] === null){
                    console.log("The boat does not exist");
                    return boat[0];
                }
                else {
                    console.log("located in number 5")
                    const key = datastore.key([SLIPS, parseInt(slip[0].id, 10)]);
                    data = {"current_boat": null, "number": slip[0].number}
                    datastore.save({"key": key, "data": data });
                    console.log("THE SHIP HAS SAILED!!!!")
                    return "Available"
                }
            });
        }
    });
}

/* ------------- End Model Functions -> Slips ------------- */

/* ------------- Begin Controller Functions for Boats ------------- */

router.get('/boats', function (req, res) {
    console.log("getting the boats")
    const boats = get_boats()
        .then((boats) => {
            boats = appendSelf(boats, req.protocol + '://' + req.get('host') + req.originalUrl + '/');
            res.status(200).json(boats);
        });
});

router.get('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                boat = boat[0];
                boat.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.status(200).json(boat);
            }
        });
});



router.post('/boats', function (req, res) {
    console.log("posting the boats")     
    if (req.body.name == null || req.body.type == null || req.body.length == null){
        res.status(400).send('{"Error": "The request object is missing at least one of the required attributes"}')
    }
    else{
        post_boat(req.body.name, req.body.type, req.body.length)
            .then(key => {
                //var findURL = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                //console.log(findURL);
                //append self and complete URL
                key.self = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                console.log(key);
                res.status(201).send(key) });
}});

router.patch('/boats/:id', function (req, res) {
    console.log("patching the boats")     
    if (req.body.name == null || req.body.type == null || req.body.length == null){
        res.status(400).send('{"Error": "The request object is missing at least one of the required attributes"}')
    }
    else{
        patch_boat(req.params.id, req.body)
            .then(boat => {
                console.log(boat)
                if (boat === undefined || boat === null) {
                    // The 0th element is undefined. This means there is no lodging with this id
                    res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
                } else {
                    boat.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.status(200).json(boat);
                }
            });
}});

router.put('/:id', function (req, res) {
    console.log("putting the boats")
    put_boat(req.params.id, req.body.name, req.body.type, req.body.length)
        .then(res.status(200).end());
});

router.delete('/boats/:id', function (req, res) {
    delete_boat(req.params.id)
    .then(boat => {
        console.log(boat)
        if (boat === undefined || boat === null) {
            // The 0th element is undefined. This means there is no lodging with this id
            res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        } else {
            res.status(204).end();
        }
    });
});

/* ------------- End Controller Functions for Boats------------- */
/* ------------- Begin Controller Functions for Slips ------------- */

router.get('/slips', function (req, res) {
    console.log("getting the slips")
    const slips = get_slips()
        .then((slips) => {
            slips = appendSelf(slips, req.protocol + '://' + req.get('host') + req.originalUrl + '/');
            res.status(200).json(slips);
        });
});

router.get('/slips/:id', function (req, res) {
    console.log(req.params.id);
    get_slip(req.params.id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No slip with this slip_id exists' });
            } else {
                slip = slip[0];
                slip.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.status(200).json(slip);
            }
        });
});

router.post('/slips', function (req, res) {
    console.log("posting the slips")     
    if (req.body.number == null){
        res.status(400).send('{"Error": "The request object is missing the required number"}')
    }
    else{
        post_slip(req.body.number)
            .then(key => {
                //var findURL = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                //console.log(findURL);
                //append self and complete URL
                key.self = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                console.log(key);
                res.status(201).send(key) });
}});

router.delete('/slips/:id', function (req, res) {
    delete_slip(req.params.id)
    .then(slip => {
        console.log(slip)
        if (slip === undefined || slip === null) {
            // The 0th element is undefined. This means there is no lodging with this id
            res.status(404).json({ 'Error': 'No slip with this slip_id exists' });
        } else {
            res.status(204).end();
        }
    });
});

router.put('/slips/:slip_id/:boat_id', function (req, res){
    console.log(req.params);
    slip_parkingEnter(req.params.slip_id, req.params.boat_id)
    .then((parking) => {
        console.log(parking);
        if (parking === "Occupied"){
            res.status(403).json({ 'Error': 'The slip is not empty' });
        }
        else if (parking === undefined){
            res.status(404).json({ 'Error': 'The specified boat and/or slip does not exist' });
        }
        else{
            res.status(204).end();
        }
    });

});



router.delete('/slips/:slip_id/:boat_id', function (req, res){
    console.log("Let's get the boat out!!");
    depart_slip(req.params.slip_id, req.params.boat_id)
    .then((parking) => {
        console.log(parking);
        if (parking === "Occupied"){
            res.status(404).json({ 'Error': 'No boat with this boat_id is at the slip with this slip_id' });
        }
        else if (parking === undefined){
            res.status(404).json({ 'Error': 'No boat with this boat_id is at the slip with this slip_id' });
        }
        else{
            res.status(204).end();
        }
    });

});

/* ------------- Begin Controller Functions for Slips ------------- */

app.use('/', router);



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});