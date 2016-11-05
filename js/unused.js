searchOptions = {
  // Currently hard coded to Bristol but this will be based on the users location.
  // Automatically, or if location services are off, by prompting for a "home city"
  location: {lat: 51.454514, lng: -2.587910},
  radius: 500,
  // bounds: map.getBounds(), // Work out how to get the bounds from the current map viewport.
  type: ['restaurant']
}

// Initialise the map showing all local restaurants.
// Places Services object - this will search nearby places and it will retrieve further place details.
placeServices = new google.maps.places.PlacesService(map);
placeServices.nearbySearch(searchOptions, placeSearchCallback);



// Call back function for restaurant search.
function placeSearchCallback(results, status) {
  restaurants = results;
  createMarkersFromArray(results);
}




  searchOptions = {
    // Currently hard coded to Bristol but this will be based on the users location.
    // Automatically, or if location services are off, by prompting for a "home city"
    location: {lat: 51.454514, lng: -2.587910},
    radius: 500,
    // bounds: map.getBounds(), // Work out how to get the bounds from the current map viewport.
    type: ['restaurant']
  }

  // Initialise the map showing all local restaurants.
  // Places Services object - this will search nearby places and it will retrieve further place details.
  placeServices = new google.maps.places.PlacesService(map);
  placeServices.nearbySearch(searchOptions, placeSearchCallback);




  // Create the icon settins to be used.
  var icon = {
    url: place.icon,
    size: new google.maps.Size(35,35),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(15,34),
    scaledSize: new google.maps.Size(25,25)
  };




  // Gets place details based on place ID.
  function placeDetailsInfoOnClick(marker, infoWindow) {
    placeServices.getDetails({placeId: marker.id}, populateInfoWindow);
  }

  // Load up info into an info window and display it.
  function populateInfoWindow(results, status) {
    console.log(results);
    console.log(status);
    mainInfoWindow.setContent("<h3>" + results.name + " </h3>" + "<p>" + results.formatted_address + "</p>");
    mainInfoWindow.open(map);
  }
