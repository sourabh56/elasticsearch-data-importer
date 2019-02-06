const elasticSearch = require('elasticsearch');
const readlineSync = require('readline-sync');
const cliInteract = require('cli-interact');

let insertedIndex = 1;
const elasticSearchObjectStaging = new elasticSearch.Client({
    host:[readlineSync.question('Import from : ')]
})
const elasticSearchObject = new elasticSearch.Client({
    hosts:[readlineSync.question('Export to : ')]
})
const indexName = readlineSync.question('Source Index : ');
const docType = readlineSync.question('Source Type : ');
const indexNameDestination = readlineSync.question('Destination Index : ');
const destinationDocType = readlineSync.question('Destination Type : ');
console.log('Please verify above details : ');
		let query = cliInteract.getYesNo;
		let answer = query('Are you sure?');
		if (!answer) {
			console.log('Aborted');
			return;
        }

function createConnectionStaging(){
    return new Promise((resolve, reject)=>{
        elasticSearchObjectStaging.ping({
            requestTimeout : 3000,
        }, function(error){
            if(error){
                console.log(error)
                return reject(error)
            }
            else{
                return resolve({message : "Connected"})
            }
        })
    })
}

function createConnection(){
    return new Promise((resolve, reject)=>{
        elasticSearchObject.ping({
            requestTimeout : 3000,
        }, function(error){
            if(error){
                console.log(error)
                return reject(error)
            }
            else{
                return resolve({message : "Connected"})
            }
        })
    })
}

async function getProductDetailsWithScrollId(options={}){
    let {size,i} = options;
    await createConnectionStaging()
    let initialProductdetails = await elasticSearchObjectStaging.search({
                                "index" : indexName,
                                "type" : docType,
                                "size" : size,
                                "scroll" : "1m"
                            })
    await addProductDetailsCaller({initialProductdetails : initialProductdetails.hits.hits, size, i})
    
    await getProductDetailsWithoutScrollId({initialProductdetails : initialProductdetails.hits.hits, size, scroll_id : initialProductdetails._scroll_id || null, i : 0}) 
}

async function getProductDetailsWithoutScrollId(options={}){
    return new Promise(async(resolve, reject)=>{
        let {initialProductdetails, size, scroll_id, i} = options;

            await createConnectionStaging();

            let productWithScrollId = await elasticSearchObjectStaging.scroll({
                                            scroll_id : scroll_id,
                                            scroll  : "1m"
                                    })
            if(productWithScrollId.hits.hits.length > 0){
                let response = await addProductDetailsCaller({initialProductdetails : productWithScrollId.hits.hits, i})
                .then(msg =>{
                    getProductDetailsWithoutScrollId({scroll_id : productWithScrollId._scroll_id, i})
                })
            }
            else
                console.log("All data imported")
            })
    
}

async function addNewProductDetails(options ={}){
    let {insertValue, i} = options;

    await createConnection();
    
    return await elasticSearchObject.create({
                    index : indexNameDestination,
                    type : insertValue._type,
                    id : insertValue._id,
                    body : insertValue._source
                })
}

async function addProductDetailsCaller(options ={}){
    return new Promise( async(resolve, reject)=>{

        let {initialProductdetails, i, size} = options;
        if(size == i){ 
            return resolve({message : "Added all nested data"})
        }

        let insertValue = initialProductdetails[i]
        
        let addedResponse = await addNewProductDetails({insertValue, i})
                            .then(async (msg) =>{
                                console.log("Added :: ",insertedIndex++)
                                i++
                                await addProductDetailsCaller({initialProductdetails, i, size})
                            })
                            .catch(err =>{
                            })
        return resolve({message  : addedResponse})
    })
}

async function getMapping(){
    try{
        await createConnectionStaging()
        let mapping = await elasticSearchObjectStaging.indices.getMapping({
            index : indexName,
            type : docType
        })
        setMapping({mapping})
    }
    catch(err){
        console.log("Error getMapping :: "+err.message)
    }
}

async function setMapping({mapping}){
    try{
        await createConnection();
        await elasticSearchObject.indices.create({
            index : indexNameDestination
        })
        let responseIndexCreation = await elasticSearchObject.indices.putMapping({
                                    index : indexNameDestination,
                                    type : destinationDocType,
                                    body : mapping[indexName].mappings[docType]
                                })
        if(responseIndexCreation.acknowledged)
            getProductDetailsWithScrollId({size : 100, i:0})
        else 
            console.log("Something went wrong")
    }
    catch(err){
        console.log("Error setMapping ::"+err.message)
    }
}

getMapping()