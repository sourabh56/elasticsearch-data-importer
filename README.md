# elasticsearch-data-importer
Import data from one elasticsearch server to another using Node.js.

### Pre-requisite:
Clone the repo and run following command in the installed directory:  
`$ npm install`  
OR simply run:  
`$ npm install elasticsearch-data-importer`
### Usage
Open the directory in terminal and run:
```
$ node index.js
```
This will prompt you to provide the folowing details: 
```
$ Import from : http://localhost:9200
$ Export to : http://localhost:9200
$ Source Index : parent
$ Source Type : doc
$ Destination Index : child
$ Destination Type : doc
$ Please verify above details :
$ Are you sure? (y/n)? y
```
After this the data import will start :
```
Added :: 1
Added :: ....
Added :: 1000
All data imported
```
