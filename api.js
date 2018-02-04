
detectLogo('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSivdS2xaRNas6wDQPdtoGnKIPerU6r91_eeocUtZxAqsteFIhMgA');

function detectLogo(imgURL){

	urlToFile(imgURL);

	function urlToFile(url){
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'blob';
		request.onload = function() {
					var reader = new FileReader();
					reader.readAsDataURL(request.response);
					reader.onload =  function(e){
						rest(e.target.result);
					};
		};
		request.send();
	}

	function rest(){

		var img = urlToFile(imgURL);

		fetch(imgSource)
		.then(res => res.blob()) // Gets the response and returns it as a blob
		.then(blob => {
			// Here's where you get access to the blob
			// And you can use it for whatever you want
			// Like calling ref().put(blob)

			// Here, I use it to make an image appear on the page
			let objectURL = URL.createObjectURL(blob);
			let myImage = new Image();
			myImage.src = objectURL;

			return myImage;
		}).then(myImage =>{


			function selectReadfile(myImage) {
				var reader = new FileReader();
				reader.readAsDataURL(myImage);
				reader.onload = function(){
					readDrawImg(reader, canvas, 0, 0);
				}
			}

			
			// draw image
			function readDrawImg(reader){
				var img = readImg(reader);
				img.onload = function(){
					var w = img.width;
					var h = img.height;
					var resize = resizeWidthHeight(320, w, h);
					fastSearch(canvas, resize.w, resize.h);
				}
			}

			// read image
			function readImg(reader){
				var result_dataURL = reader.result;
				var img = new Image();
				img.src = result_dataURL;
				return img;
			}

			// fast search
			function fastSearch(canvas, w, h){
				var context = canvas.getContext("2d");
				var img_data = context.getImageData(0, 0, w, h);
				var xhr = new XMLHttpRequest();
				var boundary = generateUuid();
				var group_id = document.forms.form1.group_id.value
				if (group_id == "") group_id = 0;
				xhr.open("POST" , "https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
				console.log("https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
				xhr.onload=function(){
					if (xhr.readyState === 4) {
					console.log( xhr.response );
					if (xhr.status === 200) {
						var data = JSON.parse(xhr.response);
						var div = document.getElementById("result1");
						div.textContent = JSON.stringify(data, null , "\t");
					} else if (xhr.status === 404) {
						var div = document.getElementById("result1");
						div.textContent = "404 The requested URL was not found on the server.\n It may be caused by inncorrect Group ID.\n Please check your Group ID in LOGIN/PROFILE page.";
					}
					}
				};
				xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary="+boundary);

				// part #1 headder
				var headder_str = "--" + boundary + "\r\n";
				headder_str += "Content-Disposition: form-data; name=\"image\"; filename=\"ArcheLiteImage.data\"\r\n";
				headder_str += "Content-Type: application/octet-stream\r\n";
				headder_str += "Content-Transfer-Encoding: binary\r\n\r\n";

				// mime footer
				var footer_str = "--" + boundary + "--\r\n";

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
					var p = (img_data.data[i] + img_data.data[i+1] + img_data.data[i+2]) /3;
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
			}

		});
	}
}
