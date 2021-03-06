//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
const crypto = require('crypto');
const sharedSecret = "g8+DG5Mkf0UzfWCc9RA1QRezs4QdR4qChxhj1ReB/bM=";
const bufSecret = Buffer(sharedSecret, "base64");

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
	"pl",
	"bastion",
	"nva",
	"natgw",
	"other",
];

var expMsg = `
---
<b>Products<\/b> \n\n
\\\"lb\\\" : Load Balancer\n\n
\\\"appgw\\\" : Application Gateway \n\n
\\\"vpngw\\\" : VPN Gateway \n\n
\\\"vwan\\\" : Virtual WAN\n\n
\\\"tm\\\" : Traffic Manager\n\n
\\\"fd\\\" : Front Door\n\n
\\\"vnet\\\" : Virtual Network \n\n
\\\"fw\\\" : Azure Firewall\n\n
\\\"nsg\\\" : Network Security Group\n\n
\\\"er\\\" : ExpressRoute\n\n
\\\"dns\\\" : Azure DNS\n\n
\\\"cdn\\\" : Azure CDN\n\n
\\\"nw\\\" : Network Watcher\n\n
\\\"publicip\\\" : Public IP Address\n\n
\\\"ddos\\\" : DDOS Protection\n\n
\\\"pl\\\" : Private Link\n\n
\\\"bastion\\\" : Azure Bastion\n\n
\\\"nva\\\" : NVA\n\n
\\\"natgw\\\" : NAT Gateway (NAT Service)\n\n
\\\"other\\\" : Others\n\n
---
`;



// Connect: Azure SQL Database
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

var config =
{
	authentication: {
		options: {
			userName: 'mayoneka',
			password: 'ZAQ!2wsxCDE#'
		},
		type: 'default'
	},
	server: 'mayoneka-bot-db.database.windows.net',
	options:
	{
		database: 'mayoneka-bot-db',
		encrypt: true
	}
}

// const connection = new Connection(config);

var http = require('http');
// var PORT = process.env.port || process.env.PORT || 8080;
var PORT = process.env.port || process.env.PORT || 3333;

http.createServer(function (request, response) {
	var payload = '';
	// Process the request
	request.on('data', function (data) {
		payload += data;
	});

	// Respond to the request
	request.on('end', async function () {
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

				// Validation the inputed date
				var receivedMsg = JSON.parse(payload);
				var textArray = receivedMsg.text.split(' ').filter(Boolean);
				for (let i = 0; i < textArray.length; i++) {
					textArray[i] = textArray[i].replace(/\r?\n/g, '');
					textArray[i] = textArray[i].replace('&nbsp;', '');
					textArray[i] = textArray[i].replace('<at>mayoneka-bot3</at>', '');
					textArray[i] = textArray[i].replace('<div', '');
					textArray[i] = textArray[i].replace('itemprop="copy-paste-block">', '');
					textArray[i] = textArray[i].replace('<at>', '');
					textArray[i] = textArray[i].replace('</at>', '');
					// textArray[i] = textArray[i].replace('', '');

				}
				textArray = textArray.filter(Boolean);

				console.log(textArray);
				var switchKeyword = textArray[0];

				switch (switchKeyword) {

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

						if (members.indexOf(member) == -1) {
							var responseMsg = '{ "type": "message", "text": "Please check the inputed name." }';
							break;
						}

						if (networkProducts.indexOf(product) == -1) {
							var responseMsg = '{ "type": "message", "text": "Please choose in  ' + networkProducts.join(', ') + '." }';
							break;
						}

						if (['bc', 'premier'].indexOf(isPremier) == -1) {
							var responseMsg = '{ "type": "message", "text": "Please select BC or PREMIER." }';
							break;
						}

						if (operate == 'add') {
							var resultMsg = "An unknown error occurred";
							var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
							const connection = new Connection(config);
							connection.on('connect', function (err) {
								if (err) {
									// ERROR - SQL Serer connect error.
									console.log('SQL Serer connect error.(' + err + ')');
									// 終了
									process.exit();
								}
								// Info - SQL Server connected.
								console.log('SQL Server connected.');
								// 接続したらクエリ実行
								let sql = "INSERT INTO assign (sr,name,product,contract) VALUES (" + srNum + ",'" + member + "','" + product + "','" + isPremier + "')";
								const request = new Request(sql, function (err, rows) {
									if (err) {
										// ERROR - Query request error.
										console.log('Query request error.(' + err + '');
										resultMsg = "SR is already assigned.";
										responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
									} else {
										// INFO - Run query. sql
										resultMsg = "ADD: {name: " + member + ", product: " + product + ", contract: " + isPremier + " }";
										responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
										console.log('Run query. ' + sql);
									}
									response.write(responseMsg);
									response.end();
									// close
									connection.close();
								});
								connection.execSql(request);
							});

							break;

						} else if (operate == 'del') {
							var resultMsg = "An unknown error occurred";
							var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
							const connection = new Connection(config);
							connection.on('connect', function (err) {
								if (err) {
									// ERROR - SQL Serer connect error.
									console.log('SQL Serer connect error.(' + err + ')');
									// 終了
									process.exit();
								}
								// Info - SQL Server connected.
								console.log('SQL Server connected.');
								// 接続したらクエリ実行
								let sql = "DELETE FROM assign WHERE sr=" + srNum + " AND " + "name='" + member + "'";
								const request = new Request(sql, function (err, rows) {
									if (err) {
										// ERROR - Query request error.
										console.log('Query request error.(' + err + '');
										resultMsg = err.message;
										responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
									} else {
										// INFO - Run query. sql
										var resultMsg = "DELETE: {name: " + member + ", product: " + product + ", contract: " + isPremier + " }";
										var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
										console.log('Run query. ' + sql);
									}
									response.write(responseMsg);
									response.end();
									// close
									connection.close();
								});
								connection.execSql(request);
							});
							console.log(responseMsg);
							break;

						}

					case 'show':
						var resultMsg = "<a href\=\\\"https\:\/\/msit.powerbi.com\/groups\/3e65b7f1-ae65-4bb9-9059-b8b50652deb4\/reports\/a44bc08b-d0d0-49fb-8b6d-d2d196fa128f\/ReportSection\\\">assign tool<\/a>"
						var responseMsg = '{ "type": "message", "text": "' + resultMsg + '" }';
						break;

					case 'help':
					default:
						var str = "ex.) assign [SR num] [Alias] [Product] [BC/Premier] [add/del]"
						var responseMsg = '{ "type": "message", "text": "' + str + '\n\n' + expMsg + '"}'
						break;
				}

			} else {
				var responseMsg = '{ "type": "message", "text": "Error: message sender cannot be authenticated." }';
			}
		}
		catch (err) {
			response.writeHead(400);
			return response.end("Error: " + err + "\n" + err.stack);
		}
	});

}).listen(PORT);

console.log('Listening on port %s', PORT);
