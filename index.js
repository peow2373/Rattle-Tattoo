// Webcam code to take a picture of the tattoo
(function() {

  var width = 320; // We will scale the photo width to this
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
              video: true,
              width: 320,
              height: 240,
              audio: false
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
          camerabutton.classList.add("hidden");
          video.classList.remove("hidden");
          startbutton.classList.remove("hidden");
          ev.preventDefault();
      }, false);

      // If the "Take Photo" button is pressed
      startbutton.addEventListener('click', function(ev) {
          takePicture();
          ev.preventDefault();

          camerabutton.classList.remove("hidden");
          video.classList.add("hidden");
          startbutton.classList.add("hidden");
          printbutton.classList.remove("hidden");
          resetbutton.classList.remove("hidden");
      }, false);

      // If the "Print Tattoo" button is pressed
      printbutton.addEventListener('click', function(ev) {
          printPhoto();
          ev.preventDefault();
      }, false);

      // If the "New Tattoo" button is pressed
      resetbutton.addEventListener('click', function(ev) {
          ev.preventDefault();

          camerabutton.classList.remove("hidden");
          video.classList.add("hidden");
          startbutton.classList.add("hidden");
          printbutton.classList.add("hidden");
          resetbutton.classList.add("hidden");  
      }, false);

      showReference();
      clearPhoto();
  }

  function printPhoto() {

  }


  function clearPhoto() {
      var context = canvas.getContext('2d');
      context.fillStyle = "#AAA";
      context.fillRect(0, 0, canvas.width, canvas.height);

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
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
    var image = document.getElementById('reference1');

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    var data = canvas.toDataURL('image/png');
    reference.setAttribute('src', data);
    
    currentReference = image;

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
    const totalPixels = height*width;

    var imgDataOutput = new ImageData(width, height);

    var numSamePixels = comparePixels(imgDataBefore.data, imgDataAfter.data, imgDataOutput);

    console.log((Math.round(numSamePixels/totalPixels * 100)) + "% accuracy");
  }

  // Converts image to canvas; returns new canvas element
  function convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").drawImage(image, 0, 0, 320, 240);
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

    console.log(imgDataOutput);
  }

  function comparePixels(img1, img2, imgOutput) { 
    // Determines the tolerance for deciding if a pixel is black or white
    var threshold = 120;
    var samePixels = 0;

    // Check to see if the pixels are the same color
    for (var i = 0; i < img1.length; i += 4) {
      var avg1 = (img1[i] + img1[i+1] + img1[i+2])/3;
      var avg2 = (img2[i] + img2[i+1] + img2[i+2])/3;

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