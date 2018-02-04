var Jimp = require("jimp");
var request = require('request');
var xhr = new XMLHttpRequest();
var matched = false;
var w = 320;
var h = 240;
//boogle
var origh = 576;

Jimp.read("https://www.shoothill.com/wp-content/uploads/2016/03/newbbc2.png", function (err, image) {
	image.crop( 0, origh-240, 320, 240 ) 

	// var img_data = context.getImageData(0, 0, w, h);
	var img_data = new Uint8ClampedArray(image.bitmap.data);
	var xhr = new XMLHttpRequest();
	// var boundary = generateUuid();
	var boundary = "--7d45b106-5920-449e-bd9d-4019acd344a2";
	var group_id = "1004";
	if (group_id == "") group_id = 0;

	///////////////////////////////////////////////////////////////////
	var formData = {
		// Pass a simple key-value pair
		my_field: 'my_value',
		// Pass data via Buffers
		my_buffer: new Buffer([1, 2, 3]),
		// Pass data via Streams
		my_file: fs.createReadStream(__dirname + '/unicycle.jpg'),
		// Pass multiple values /w an Array
		attachments: [
		  fs.createReadStream(__dirname + '/attachment1.jpg'),
		  fs.createReadStream(__dirname + '/attachment2.jpg')
		],
		// Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
		// Use case: for some types of streams, you'll need to provide "file"-related information manually.
		// See the `form-data` README for more information about options: https://github.com/form-data/form-data
		custom_file: {
		  value:  fs.createReadStream('/dev/urandom'),
		  options: {
			filename: 'topsecret.jpg',
			contentType: 'image/jpeg'
		  }
		}
	  };
	  request.post({url:'http://service.com/upload', formData: formData}, function optionalCallback(err, httpResponse, body) {
		if (err) {
		  return console.error('upload failed:', err);
		}
		console.log('Upload successful!  Server responded with:', body);
	  });

	///////////////////////////////////////////////////////////////////



	xhr.open("POST" , "https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
	console.log("https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
	xhr.onload=function(){
		if (xhr.readyState === 4) {
			console.log( xhr.response );
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.response);
				if(data[0].score > 0.5){
					matched = true;
					console.log(matched);
				}
			//   div.textContent = JSON.stringify(data, null , "\t");
			} else if (xhr.status === 404) {
				// div.textContent = "404 The requested URL was not found on the server.\n It may be caused by inncorrect Group ID.\n Please check your Group ID in LOGIN/PROFILE page.";
			}
		}
	};
	xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary="+boundary);

	// part #1 headder
	var headder_str = '--7d45b106-5920-449e-bd9d-4019acd344a2\r\n';
	headder_str += 'Content-Disposition: form-data; name="image"; filename="ArcheLiteImage.data"\r\n';
	headder_str += 'Content-Type: application/octet-stream\r\n';
	headder_str += 'Content-Transfer-Encoding: binary\r\n\r\n';
	// var headder_str = "--" + boundary + "\r\n";
	// headder_str += "Content-Disposition: form-data; name=\"image\"; filename=\"ArcheLiteImage.data\"\r\n";
	// headder_str += "Content-Type: application/octet-stream\r\n";
	// headder_str += "Content-Transfer-Encoding: binary\r\n\r\n";

	// mime footer
	var footer_str = "--7d45b106-5920-449e-bd9d-4019acd344a2\r\n";
	// var footer_str = "--" + boundary + "--\r\n";

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

	xhr.send( data );


});