// Some variables  and cuntions for use with the map.
// The variable that will hold the google.maps Map object.
var map;

// The users location and marker.
var userLocation;
var youAreHereMarker;

// The main array for displaying the found locations.
var restaurantMarkers = [];

// The variable to hold the PlacesService object.
var placeSearch;
var searchOptions; // The object that gets passed to PlacesService search.

function placeSearchCallback(results, status) {
  console.log(results);
}

// The main function that is called by the call to Google maps.
function initMeatMap() {
  "use strict";

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.454514, lng: -2.587910},
    zoom: 12,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
    }
  });

  // Users location - replace with a custom icon and you are here infowindow.
  youAreHereMarker = new google.maps.Marker({
          position: {lat: 51.454514, lng: -2.587910},
          map: map
        });

  searchOptions = {
    // Currently hard coded to Bristol but this will be based on the users location.
    // Automatically, or if location services are off, by prompting for a "home city"
    location: {lat: 51.454514, lng: -2.587910},
    radius: 5000,
    // bounds: map.getBounds(), // Work out how to get the bounds from the current map viewport.
    type: ['restaurant']
  }

  // Initialise the map showing all local restaurants.
  placeSearch = new google.maps.places.PlacesService(map);
  placeSearch.nearbySearch(searchOptions, placeSearchCallback);

}
