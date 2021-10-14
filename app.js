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
        console.log(entity);
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

function put_boat(id, name, type, length) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}

function delete_boat(id) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.delete(key);
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

/* ------------- End Model Functions -> Slips ------------- */

/* ------------- Begin Controller Functions for Boats ------------- */

router.get('/', function (req, res) {
    console.log("getting the boats")
    const boats = get_boats()
        .then((boats) => {
            res.status(200).json(boats);
        });
});

router.get('/boats/:id', function (req, res) {
    console.log(req.params.id);
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

router.put('/:id', function (req, res) {
    console.log("putting the boats")
    put_boat(req.params.id, req.body.name, req.body.type, req.body.length)
        .then(res.status(200).end());
});

router.delete('/:id', function (req, res) {
    delete_boat(req.params.id).then(res.status(200).end())
});delete_boat
/**
 * This route is not in the file discussed in the video. It demonstrates how to
 * get a single lodging from Datastore using the provided id and also how to 
 * determine when no lodging exists with that ID.
 */


/* ------------- End Controller Functions for Boats------------- */
/* ------------- Begin Controller Functions for Slips ------------- */

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

/* ------------- Begin Controller Functions for Slips ------------- */

app.use('/', router);



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});