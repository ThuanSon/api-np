var Canvas2Image = (function() {

	// Kiểm tra xem trình duyệt có hỗ trợ canvas hay không
	var bHasCanvas = false;
	var oCanvas = document.createElement("canvas");
	if (oCanvas.getContext("2d")) {
		bHasCanvas = true;
	}

	// Nếu không có hỗ trợ canvas, trả về các hàm trống để tránh lỗi.
	if (!bHasCanvas) {
		return {
			saveAsBMP : function(){},
			saveAsPNG : function(){},
			saveAsJPEG : function(){}
		}
	}

	// Kiểm tra xem trình duyệt có hỗ trợ getImageData và toDataURL không
	var bHasImageData = !!(oCanvas.getContext("2d").getImageData);
	var bHasDataURL = !!(oCanvas.toDataURL);
	var bHasBase64 = !!(window.btoa); // Kiểm tra hỗ trợ base64

	var strDownloadMime = "image/octet-stream"; // MIME type cho download

	// Hàm đọc dữ liệu từ canvas
	var readCanvasData = function(oCanvas) {
		var iWidth = parseInt(oCanvas.width);
		var iHeight = parseInt(oCanvas.height);
		return oCanvas.getContext("2d").getImageData(0, 0, iWidth, iHeight);
	}

	// Mã hóa dữ liệu thành base64
	var encodeData = function(data) {
		var strData = "";
		if (typeof data == "string") {
			strData = data;
		} else {
			var aData = data;
			for (var i = 0; i < aData.length; i++) {
				strData += String.fromCharCode(aData[i]);
			}
		}
		return btoa(strData);
	}

	// Tạo chuỗi base64 chứa dữ liệu BMP
	var createBMP = function(oData) {
		var aHeader = []; // Header cho file BMP
	
		var iWidth = oData.width;
		var iHeight = oData.height;

		aHeader.push(0x42); // 'B'
		aHeader.push(0x4D); // 'M' - BMP Magic Number
	
		var iFileSize = iWidth * iHeight * 3 + 54; // Kích thước file BMP
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256);

		aHeader.push(0); // Dành cho reserved
		aHeader.push(0);
		aHeader.push(0); // Dành cho reserved
		aHeader.push(0);

		aHeader.push(54); // Offset của dữ liệu ảnh
		aHeader.push(0);
		aHeader.push(0);
		aHeader.push(0);

		var aInfoHeader = []; // Header thông tin của BMP
		aInfoHeader.push(40); // Kích thước header
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);

		// Độ rộng của hình ảnh
		var iImageWidth = iWidth;
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256);
	
		// Độ cao của hình ảnh
		var iImageHeight = iHeight;
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256);
	
		aInfoHeader.push(1); // Số lượng planes
		aInfoHeader.push(0);
	
		aInfoHeader.push(24); // Số bit mỗi pixel (24-bit màu)
		aInfoHeader.push(0);
	
		aInfoHeader.push(0); // Không nén dữ liệu
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);
	
		// Kích thước dữ liệu hình ảnh
		var iDataSize = iWidth * iHeight * 3; 
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); 
	
		// 16 bytes không sử dụng
		for (var i = 0; i < 16; i++) {
			aInfoHeader.push(0);
		}
	
		var iPadding = (4 - ((iWidth * 3) % 4)) % 4; // Padding cho mỗi hàng pixel

		var aImgData = oData.data; // Dữ liệu hình ảnh

		var strPixelData = "";
		var y = iHeight;
		do {
			var iOffsetY = iWidth * (y - 1) * 4;
			var strPixelRow = "";
			for (var x = 0; x < iWidth; x++) {
				var iOffsetX = 4 * x;

				// Mã hóa các giá trị màu RGB cho mỗi pixel
				strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 2]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 1]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX]);
			}
			// Thêm padding
			for (var c = 0; c < iPadding; c++) {
				strPixelRow += String.fromCharCode(0);
			}
			strPixelData += strPixelRow;
		} while (--y);

		// Mã hóa và trả về dữ liệu BMP
		var strEncoded = encodeData(aHeader.concat(aInfoHeader)) + encodeData(strPixelData);

		return strEncoded;
	}

	// Gửi file đã tạo đến client
	var saveFile = function(strData) {
		document.location.href = strData;
	}

	// Tạo Data URI từ dữ liệu và MIME type
	var makeDataURI = function(strData, strMime) {
		return "data:" + strMime + ";base64," + strData;
	}

	// Tạo đối tượng <img> chứa dữ liệu ảnh
	var makeImageObject = function(strSource) {
		var oImgElement = document.createElement("img");
		oImgElement.src = strSource;
		return oImgElement;
	}

	// Thay đổi kích thước canvas
	var scaleCanvas = function(oCanvas, iWidth, iHeight) {
		if (iWidth && iHeight) {
			var oSaveCanvas = document.createElement("canvas");
			oSaveCanvas.width = iWidth;
			oSaveCanvas.height = iHeight;
			oSaveCanvas.style.width = iWidth + "px";
			oSaveCanvas.style.height = iHeight + "px";

			var oSaveCtx = oSaveCanvas.getContext("2d");

			oSaveCtx.drawImage(oCanvas, 0, 0, oCanvas.width, oCanvas.height, 0, 0, iWidth, iHeight);
			return oSaveCanvas;
		}
		return oCanvas;
	}

	// Các hàm chính để lưu ảnh với các định dạng khác nhau
	return {

		saveAsPNG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}
			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			var strData = oScaledCanvas.toDataURL("image/png");
			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace("image/png", strDownloadMime));
			}
			return true;
		},

		saveAsJPEG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}

			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			var strMime = "image/jpeg";
			var strData = oScaledCanvas.toDataURL(strMime);
	
			// Kiểm tra nếu trình duyệt hỗ trợ định dạng JPEG
			if (strData.indexOf(strMime) != 5) {
				return false;
			}

			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace(strMime, strDownloadMime));
			}
			return true;
		},

		saveAsBMP : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!(bHasImageData && bHasBase64)) {
				return false;
			}

			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);

			var oData = readCanvasData(oScaledCanvas);
			var strImgData = createBMP(oData);
			if (bReturnImg) {
				return makeImageObject(makeDataURI(strImgData, "image/bmp"));
			} else {
				saveFile(makeDataURI(strImgData, strDownloadMime));
			}
			return true;
		}
	};

})();
