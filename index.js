// Webcam code to take a picture of the tattoo
(function() {

  var width = 240; // We will scale the photo width to this
  var height = 0; // This will be computed based on the input stream

  var streaming = false;

  var video = null;
  var canvas = null;
  var startbutton = null;

  var photo = null;
  var reference = null;
  var difference = null;

  var currentReference;
  var currentTattoo;
  var currentDifference;

  var referenceNumber = 1;
  var usedReferences = new Array();

  var numSamePixels;
  var totalPixels;


  function startup() {
      video = document.getElementById('video');
      canvas = document.getElementById('canvas');
      camerabutton = document.getElementById('camerabutton');
      startbutton = document.getElementById('startbutton');
      printbutton = document.getElementById('printbutton');
      resetbutton = document.getElementById('resetbutton');

      photo = document.getElementById('tattoo');
      reference = document.getElementById('reference');
      difference = document.getElementById('difference');

      navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                width: 240,
                height: 320,
                facingMode: {
                  ideal: "environment"
                }
              }
          })
          .then(function(stream) {
              video.srcObject = stream;
              video.play();
          })
          .catch(function(err) {
              console.log("An error occurred: " + err);
          });

      video.addEventListener('canplay', function(ev) {
          if (!streaming) {
              height = video.videoHeight / (video.videoWidth / width);

              if (isNaN(height)) {
                  height = width / (4 / 3);
              }

              video.setAttribute('width', width);
              video.setAttribute('height', height);
              canvas.setAttribute('width', width);
              canvas.setAttribute('height', height);
              streaming = true;
          }
      }, false);

      // If the "New Photo" button is pressed
      camerabutton.addEventListener('click', function(ev) {
          clearPhoto();
          ev.preventDefault();

          //camerabutton.classList.add("hidden");
          //document.getElementById('cameraDiv').classList.remove("hidden");
          startbutton.classList.remove("hidden");
      }, false);

      // If the "Take Photo" button is pressed
      startbutton.addEventListener('click', function(ev) {
          takePicture();
          ev.preventDefault();

          //camerabutton.classList.remove("hidden");
          //document.getElementById('cameraDiv').classList.add("hidden");
          //startbutton.classList.add("hidden");
          printbutton.classList.remove("hidden");
          resetbutton.classList.remove("hidden");

          document.getElementById('score').innerHTML = "Yoour tattoo was " + (Math.round(numSamePixels/totalPixels * 100)) + "% awesome!";
          document.getElementById('score').classList.remove("hidden");
      }, false);

      // If the "Print Tattoo" button is pressed
      printbutton.addEventListener('click', function(ev) {
          printPhoto();
          ev.preventDefault();
      }, false);

      // If the "New Tattoo" button is pressed
      resetbutton.addEventListener('click', function(ev) {
          clearPhoto();
          referenceNumber = newReference();
          showReference();
          ev.preventDefault();

          //camerabutton.classList.add("hidden");
          //document.getElementById('cameraDiv').classList.add("hidden");
          //startbutton.classList.remove("hidden");
          printbutton.classList.add("hidden");
          //resetbutton.classList.add("hidden");  
          document.getElementById('score').classList.add("hidden");
      }, false);

      referenceNumber = newReference();
      showReference();
      clearPhoto();
  }

  function newReference() {
      var number;

      number = Math.floor(Math.random() * 60);
      
      for (var i=0; i < usedReferences.length; i++) {
        if (number == usedReferences[i]) return newReference();
      }

      usedReferences.push(number);

      return number;
  }

  function printPhoto() {
      let downloadLink = document.createElement('a');
      downloadLink.setAttribute('download', 'tattoo.png');

      var tattooCanvas = convertImageToCanvas(currentTattoo);
      var tattooContext = tattooCanvas.getContext("2d");
      let tattooData = tattooContext.getImageData(0,0, tattooCanvas.width, tattooCanvas.height).data; 

      var convertedImage = new ImageData(tattooCanvas.width, tattooCanvas.height);
      var threshold = 50; 

      // Converts tattoo image to black and white
      for (var i = 0; i < tattooData.length; i += 4) {

        var avg = (tattooData[i] + tattooData[i+1] + tattooData[i+2])/3;
  
        // Convert the pixels to black or white
        if (avg >= threshold) avg = 255;
        else avg = 0;
  
        // Create the B&W image
        convertedImage.data[i] = avg;
        convertedImage.data[i+1] = avg;
        convertedImage.data[i+2] = avg;
        convertedImage.data[i+3] = 255;
      }

      console.log(convertedImage);

      // Draws the image on the canvas
      var canvas = document.createElement("canvas");
      canvas.width = tattooCanvas.width;
      canvas.height = tattooCanvas.height;
      var context = canvas.getContext('2d');
      context.putImageData(convertedImage, 0, 0);

      canvas.toBlob(function(blob) {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
      });
  }


  function clearPhoto() {
      var context = canvas.getContext('2d');
      context.fillStyle = "#AAA";
      context.fillRect(0, 0, canvas.width, canvas.height);

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      difference.setAttribute('src', data);
  }

  function takePicture() {
      var context = canvas.getContext('2d');
      if (width && height) {
          canvas.width = width;
          canvas.height = height;
          context.drawImage(video, 0, 0, width, height);

          var data = canvas.toDataURL('image/png');
          photo.setAttribute('src', data);
          currentTattoo = video;

          comparePictures();
      } else {
          clearPhoto();
      }
  }

  function showReference() {
    var context = canvas.getContext('2d');

    // Choose the reference picture
    var image = document.getElementById(`${referenceNumber}`);

    context.fillStyle = "#FFFFFF";
    context.fillRect(0,0,canvas.width,canvas.height);

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    var data = canvas.toDataURL('image/png');
    reference.setAttribute('src', data);
    
    currentReference = image;

    // Sets the difference image to a gray screen
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
    data = canvas.toDataURL('image/png');

    difference.setAttribute('src', data);
    currentDifference = image;
  }


  // Compares the two images to determine the # of different pixels
  function comparePictures() {
    var cnvBefore = convertImageToCanvas(currentReference);
    var cnvAfter = convertImageToCanvas(currentTattoo);

    var ctxBefore = cnvBefore.getContext("2d");
    var ctxAfter = cnvAfter.getContext("2d");

    let imgDataBefore = ctxBefore.getImageData(0,0, cnvBefore.width, cnvBefore.height);
    let imgDataAfter = ctxAfter.getImageData(0,0, cnvAfter.width, cnvAfter.height); 

    const height = imgDataBefore.height;
    const width = imgDataAfter.width;
    totalPixels = height*width;

    var imgDataOutput = new ImageData(width, height);

    numSamePixels = comparePixels(imgDataBefore.data, imgDataAfter.data, imgDataOutput);

    console.log((Math.round(numSamePixels/totalPixels * 100)) + "% accuracy");
  }

  // Converts image to canvas; returns new canvas element
  function convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }


  function writeResultToPage(imgDataOutput)
  {
    var canvas = document.createElement("canvas"); //  new HTMLCanvasElement();
    canvas.width = imgDataOutput.width;
    canvas.height = imgDataOutput.height;

    var ctx = canvas.getContext("2d");
    ctx.putImageData(imgDataOutput, 0, 0);

    var image = imgDataOutput;

    var data = canvas.toDataURL('image/png');
    difference.setAttribute('src', data);

    currentDifference = image;

    //console.log(imgDataOutput);
  }

  function comparePixels(img1, img2, imgOutput) { 
    // Determines the tolerance for deciding if a pixel is black or white
    var threshold = 60;
    var samePixels = 0;
    var transparentThreshold = 250;

    // Check to see if the pixels are the same color
    for (var i = 0; i < img1.length; i += 4) {

      var avg1 = (img1[i] + img1[i+1] + img1[i+2])/3;
      var avg2 = (img2[i] + img2[i+1] + img2[i+2])/3;

      if (img1[i+3] < transparentThreshold) {
        avg1 = 255;
      }

      // Convert the pixels to black or white
      if (avg1 >= threshold) avg1 = 255;
      else avg1 = 0;

      if (avg2 >= threshold) avg2 = 255;
      else avg2 = 0;

      // Create the difference image
      imgOutput.data[i] = avg2;
      imgOutput.data[i+1] = avg2;
      imgOutput.data[i+2] = avg2;
      imgOutput.data[i+3] = 255;

      for (j = 0; j < 3; j++) {
        // Change the color of the reference image to gray
        if (avg1 == 0) imgOutput.data[i+j] = 125;

        // Change the color of pixels where the tattoo overlaps the reference to green
        if (avg1 == 0 && avg2 == 0) {
          if (j == 1) imgOutput.data[i+j] = 255;
          else imgOutput.data[i+j] = 0;
        }
      }

      if (avg1 == avg2) samePixels++;
    }

    writeResultToPage(imgOutput);
      
    return samePixels;
  }

  window.addEventListener('load', startup, false);
})();
