var Jimp = require("jimp");
var http = require("http");


// var matched = false;
var w = 320;
var h = 240;
var origh = 576;

Jimp.read("https://www.shoothill.com/wp-content/uploads/2016/03/newbbc2.png", function (err, image) {
	image.crop( 0, origh-240, 320, 240 ) 

	/////////////////////////////////////////////////////////
	var img_data = new Uint8ClampedArray(image.bitmap.data);

	// part #1 headder
	var headder_str = '--7d45b106-5920-449e-bd9d-4019acd344a2\r\n';
	headder_str += 'Content-Disposition: form-data; name="image"; filename="ArcheLiteImage.data"\r\n';
	headder_str += 'Content-Type: application/octet-stream\r\n';
	headder_str += 'Content-Transfer-Encoding: binary\r\n\r\n';

	// mime footer
	var footer_str = "--7d45b106-5920-449e-bd9d-4019acd344a2\r\n";

	// part #1 data
	var data = new ArrayBuffer(headder_str.length + 16 + w * h + 2 + footer_str.length);
	var data_view = new DataView( data );
	var ptr = 0;

	for (var i = 0; i < headder_str.length; i++ ) {
		data_view.setUint8( i, headder_str.charCodeAt(i) );
	}
	ptr += headder_str.length;

	var mode = 1;
	var para = 0;
	var little_endian = true;
	data_view.setUint32( ptr + 0 , mode , little_endian );
	data_view.setUint32( ptr + 4 , para , little_endian );
	data_view.setUint32( ptr + 8 , h , little_endian );
	data_view.setUint32( ptr + 12 , w , little_endian );
	ptr += 16;

	for (var y = 0; y < h; y++) {
	for (var x = 0; x < w; x++) {
		var i = (y * w + x) * 4;
		var p = (img_data[i] + img_data[i+1] + img_data[i+2]) /3;
		data_view.setUint8( ptr + y * w + x , p );
	}
	}
	ptr += w * h;

	data_view.setUint8( ptr , "\r".charCodeAt(0) );
	data_view.setUint8( ptr + 1 , "\n".charCodeAt(0) );
	ptr += 2;

	for (var i = 0; i < footer_str.length; i++ ) {
		data_view.setUint8( ptr + i, footer_str.charCodeAt(i) );
	}
	/////////////////////////////////////////////////////////

	var req = http.request(options, function(res) {
		console.log('Status: ' + res.statusCode);
		console.log('Headers: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (body) {
			console.log('Body: ' + body);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	// write data to request body
	req.write(data);
	req.end();

});