//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
const crypto = require('crypto');
// const sharedSecret = "TSb86O2Se7f+OxwJBj8x/ht57/Lmv09EWHYMbjS4qck="; // e.g. "+ZaRRMC8+mpnfGaGsBOmkIFt98bttL5YQRq3p2tXgcE="
const sharedSecret = "m2Dcmedw8sCea9YwNrdRlNOBGsLDsxEd5wb81QmG5/E="; // e.g. "+ZaRRMC8+mpnfGaGsBOmkIFt98bttL5YQRq3p2tXgcE="
const bufSecret = Buffer(sharedSecret, "base64");
var fs = require('fs');

// メンバー、製品情報

var members = [
	"kysato",
	"ishiyam",
	"maotsuk",
	"mayoneka",
	"sakusak",
	"shinii",
	"shuda",
	"tasato",
	"tayamasa",
	"taminowa",
	"kohosoda",
	"kikawash",
	"keharada",
	"juyamagu",
];

var networkProducts = [
	"lb",
	"appgw",
	"vpngw",
	"vwan",
	"tm",
	"fd",
	"vnet",
	"fw",
	"nsg",
	"er",
	"dns",
	"cdn",
	"nw",
	"publicip",
	"ddos",
	"privatelink",
	"bastion",
	"nva",
	"other",
];

// Azure SQL Database への接続
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

var config =
{
	authentication: {
		options: {
			userName: 'testvm01', // update me
			password: 'hogeAdmin01!' // update me
		},
		type: 'default'
	},
	// server: 'anp-bot-tayamasa01.database.windows.net', // update me
	server: 'tayamasa-anp-bot-db.database.windows.net', // update me
	options:
	{
		database: 'anp-bot-db', //update me
		encrypt: true
	}
}

// const connection = new Connection(config);

var http = require('http');
// var PORT = process.env.port || process.env.PORT || 8080;
var PORT = process.env.port || process.env.PORT || 3333;

http.createServer(function(request, response) { 
	var payload = '';
	// Process the request
	request.on('data', function (data) {
		payload += data;
	});
	
	// Respond to the request
	request.on('end', function() {
		try {
			// Retrieve authorization HMAC information
			var auth = this.headers['authorization'];
			// Calculate HMAC on the message we've received using the shared secret			
			var msgBuf = Buffer.from(payload, 'utf8');
			var msgHash = "HMAC " + crypto.createHmac('sha256', bufSecret).update(msgBuf).digest("base64");
			// console.log("Computed HMAC: " + msgHash);
			// console.log("Received HMAC: " + auth);
			
			response.writeHead(200);
			if (msgHash === auth) {

				// 文字列調整
				var receivedMsg = JSON.parse(payload);
				var textArray = receivedMsg.text.split(' ').filter(Boolean);
				for(let i = 0; i < textArray.length; i++) {
					textArray[i] = textArray[i].replace(/\r?\n/g, '');
					textArray[i] = textArray[i].replace('&nbsp;', '');
					textArray[i] = textArray[i].replace('<at>z-anp-bot</at>', '');
					textArray[i] = textArray[i].replace('<div', '');
					textArray[i] = textArray[i].replace('itemprop="copy-paste-block">', '');
					textArray[i] = textArray[i].replace('<at>', '');
					textArray[i] = textArray[i].replace('</at>', '');
					// textArray[i] = textArray[i].replace('', '');

				}
				textArray = textArray.filter(Boolean);

				console.log(textArray);
				var switchKeyword = textArray[0];
				
				switch(switchKeyword) {

					case 'assign': 

					var srNum = textArray[1];
					var member = textArray[2].toLowerCase();
					var product = textArray[3].toLowerCase();
					var isPremier = textArray[4].toLowerCase();
					var operate = textArray[5].toLowerCase();
		
					if (!(srNum.match(/^[0-9]{15}$/) || srNum.match(/^[0-9]{18}$/) || srNum.match(/^[0-9]{21}$/))) {
						var responseMsg = '{ "type": "message", "text": "Please check the SR number." }';
						break;
					}

					// const connection = new Connection(config);
					// connection.on('connect', function(err) {
					// 	if ( err ) {
					// 		process.exit();
					// 	}
					// 	executeSql("count", srNum);
					// });
					
					if (members.indexOf(member) == -1) {
						var responseMsg = '{ "type": "message", "text": "Please check the inputed name." }';
						break;
					}
		
					if (networkProducts.indexOf(product) == -1) {
						var responseMsg = '{ "type": "message", "text": "Please choose in LB, APPGW, VPNGW, VWAN, TM, FD, VNET, FW, NSG, ER, DNS, CDN, NW, PUBLICIP, DDOS, PRIVATELINK, BASTION, NVA, OTHER." }';
						break;
					}
		
					if (['bc', 'premier'].indexOf(isPremier) == -1) {
						var responseMsg = '{ "type": "message", "text": "Please select BC or PREMIER." }';						
						break;
					}
		
					if (operate == 'add') {
						const connection = new Connection(config);
						connection.on('connect', function(err) {
							if ( err ) {
								// ERROR - SQL Serer connect error.
								console.log('SQL Serer connect error.(' + err + ')');
								// 終了
								process.exit();
							}
							// Info - SQL Server connected.
							console.log('SQL Server connected.');
							// 接続したらクエリ実行
							let sql = "INSERT INTO assign (sr,name,product,contract) VALUES (" + srNum + ",'" + member + "','" + product + "','" + isPremier + "')";
							const request = new Request(sql, function(err, rows) {
								if ( err ) {
									// ERROR - Query request error.
									console.log('Query request error.(' + err + '');
									// process.exit();
								}
								// INFO - Run query. sql
								console.log('Run query. ' + sql);
							   　// close
								connection.close();
							});
							connection.execSql(request);
						});
						var resultMsg = "ADD: {name: " + member + ", product: " + product + ", contract: " + isPremier + " }";
						var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
						break;
		 
					} else if (operate == 'del') {
						const connection = new Connection(config);
						connection.on('connect', function(err) {
							if ( err ) {
								// ERROR - SQL Serer connect error.
								console.log('SQL Serer connect error.(' + err + ')');
								// 終了
								process.exit();
							}
							// Info - SQL Server connected.
							console.log('SQL Server connected.');
							// 接続したらクエリ実行
							let sql = "DELETE FROM assign WHERE sr=" + srNum + " AND " + "name='" + member + "'";
							const request = new Request(sql, function(err, rows) {
								if ( err ) {
									// ERROR - Query request error.
									console.log('Query request error.(' + err + '');
									process.exit();
								}
								// INFO - Run query. sql
								console.log('Run query. ' + sql);
							   　// close
								connection.close();
							});
							connection.execSql(request);
						});
						var resultMsg = "DELETE: {name: " + member + ", product: " + product + ", contract: " + isPremier + " }";
						var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
						console.log(responseMsg);
						break;
		
					}
		
					case 'help':
					default:
					var responseMsg = '{ "type": "message", "text": "ex.) assign [SR num] [Alias] [Product] [BC/Premier] [add/del]" }';
					break;					
				}

			} else {
				var responseMsg = '{ "type": "message", "text": "Error: message sender cannot be authenticated." }';
			}
			response.write(responseMsg);
			response.end();
		}
		catch (err) {
			response.writeHead(400);
			return response.end("Error: " + err + "\n" + err.stack);
		}
	});
		
}).listen(PORT);

function executeSql(type, sr = null) {
	// Query Request
	// console.log(type);
	// console.log(sr);
    let sql = getQuery(type, sr);
    const request = new Request(sql, function(err, rows) {
        if ( err ) {
            process.exit();
        }
        connection.close();
    });
    // request.on('row', function(columns) {
	// 	// 実行結果が返ってくる
	// 	console.log(columns);
	// })
	request.on('row', function(columns) {
		columns.forEach(function(column) {
		    if (column.value === null) {
			    console.log('NULL');
		    } else {
				console.log(column.value);
		  	}
		});
	});

	connection.execSql(request);
}

function getQuery(type, sr = null, name = null) {
	// console.log(type);
	// console.log(sr);

	switch (type) {
		case "select":
			var sql = "SELECT * FROM assign where name = 'tayamasa'";
		case "count":
			var sql = "SELECT COUNT (sr) FROM assign where sr = '" + sr + "'";
	}
    return sql;
}

console.log('Listening on port %s', PORT);
