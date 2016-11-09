// Some global variables and functions for use with the map.
// The variable that will hold the google.maps Map object.
var map;

// The users location and marker.
var userLocation;
var youAreHereMarker;

// The variable to hold the Google PlacesService object.
var placeServices;
var searchOptions; // The object that gets passed to PlacesService search.

// Variable to return LatLng from user address input
var geocoder;

var heatMap = null;

var markersArray = [];

var mainInfoWindow;
var fullDetailInfoWindow;

// The main function that is called by the call to Google maps.
function initMeatMap() {
  "use strict";

  // Customised map styles...
  var styledMap = new google.maps.StyledMapType([
    {
        "featureType": "landscape",
        "stylers": [
            {
                "hue": "#FFA800"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.highway",
        "stylers": [
            {
                "hue": "#53FF00"
            },
            {
                "saturation": -73
            },
            {
                "lightness": 40
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "stylers": [
            {
                "hue": "#FBFF00"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.local",
        "stylers": [
            {
                "hue": "#00FFFD"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 30
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "water",
        "stylers": [
            {
                "hue": "#00BFFF"
            },
            {
                "saturation": 6
            },
            {
                "lightness": 8
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "hue": "#679714"
            },
            {
                "saturation": 33.4
            },
            {
                "lightness": -25.4
            },
            {
                "gamma": 1
            }
        ]
    }
  ], {name: 'Cool Map'});

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.454514, lng: -2.587910},
    zoom: 15,
    mapTypeControlOptions: {
      mapTypeIds: ['cool_map', 'roadmap', 'satellite', 'hybrid', 'terrain']
    }
  });

  map.mapTypes.set('cool_map', styledMap);
  map.setMapTypeId('cool_map');

  mainInfoWindow = new google.maps.InfoWindow();
  fullDetailInfoWindow = new google.maps.InfoWindow();

  // Initialise a 'you are here marker'.
  youAreHereMarker = new google.maps.Marker({
    map: map,
    icon: 'dist/img/you-are-here.png',
    animation: google.maps.Animation.DROP
  });

}

var viewModel = function() {
  var self = this;

  // This will hold the current array of objects as returned from the yelp API call. Changes to this made by the filter (or by the user changing their location) will cause the markers to re-render.
  self.burgerPlaces = ko.observableArray();

  self.resultsDisplaying = ko.observable(false);

  // Array to hold the heatMap location data.
  self.heatMapData = ko.observableArray();

  // When the user updates this the map will re-center and the yelp search will re-run.
  self.userLocation = ko.observable();

  self.meatType = ko.observable();

  self.minRating = ko.observable(null);

  self.filterOpenMobile = ko.observable(false);

  self.enableMeatSeek = ko.computed(function() {
    return self.meatType() && self.userLocation();
  }, this);

  self.toggleFilterMobile = function() {
    // If filter is not open. Open it and change the filter toggle div text.
    if (!self.filterOpenMobile()) {
      $('#clicktoFilter').text('Hide Filter and Results List');
      $('#map').height(300);
      $('#filterPane').fadeIn();
      self.filterOpenMobile(true);
    } else { // Otherwise do the opposite.
      $('#clicktoFilter').text('Open Filter and Results List');
      $('#map').height(400);
      $('#filterPane').fadeOut();
      self.filterOpenMobile(false);
    }
  }

  self.animateIcon = function() {
    this.setAnimation(google.maps.Animation.BOUNCE);
  }

  self.stopAnimateIcon = function() {
    this.setAnimation(null);
  }

  self.zoomToRestaurant = function() {
    // Move the map to the location of the marker, zoom in a bit, animate it, store it as bouncingIcon.
    map.setCenter(this.position);

    // Fill the main infoWindow and then open it.
    fullDetailInfoWindow.setContent(this.infoWindowContent);
    fullDetailInfoWindow.open(map, this);
  }

  // Linked to the submit bind of the search form. Gets the value and runs a geolocate call to get the LatLng.
  self.mapUpdate = function() {
    self.userLocation($('#userLocationInput').val());
    if ($('#meatTypeInput').val()) {
      self.meatType($('#meatTypeInput').val());
    }
    // Turn a search string into LatLng location.
    self.getUserGeolocation(self.userLocation());
  }

  self.getUserGeolocation = function() {
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( { address: self.userLocation() }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        // Reset the map and run the new yelp search
        map.setCenter(results[0].geometry.location);
        // Place the 'you are here marker'.
        youAreHereMarker.setPosition(results[0].geometry.location);
        // Run the yelpSearchAPI on the search string.
        self.yelpSearchAPI();
      } else {
        alert("Sorry but we could not locate your location, please try a different search");
      }
    });
  }

  self.yelpSearchAPI = function() {
    // Set the base Yelp API Url
    var yelp_url = 'https://api.yelp.com/v2/search';

    // create the parameters object. This will be used to generate the oauth key.
    var parameters = {
      oauth_consumer_key: "hpyDJOKR7-Emfyjx1F_WGg", // YELP_KEY
      oauth_token: "gkKuA7gpU51RGYIyrcFydv0lAFpMgIYI", //YELP_TOKEN
      oauth_nonce: Math.floor(Math.random() * 1e12).toString(),
      oauth_timestamp: Math.floor(Date.now()/1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version : '1.0',
      callback: 'cb',            // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
      location: self.userLocation(),
      term: self.meatType() || 'meat'
    };

    // Call the oauthSignature.generate function from the oauth-signature.js library included.
    var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, "CJK7KYhrXSwpaDaWMyGyRmw8rLc", "7iPDx4-ccWv8zpo8gcautWhgO3Q");  // ('GET',yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
    parameters.oauth_signature = encodedSignature;

    // Create the settings object for the jQuery Ajax call.
    var settings = {
      url: yelp_url,
      data: parameters,
      cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
      dataType: 'jsonp'
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings)
        .done(function(results) {
          console.log(results);
          self.createMarkersFromArray(results.businesses)
        }).fail(
        function(msg) {
          console.log("Some message?" + JSON.stringify(msg));
        });
  }

  self.createMarkersFromArray = function(placesArray) {

    // Create a new map bounds object.
    var bounds = new google.maps.LatLngBounds();

    // Remove any results related DOM elements in case no results are returned.
    self.resultsDisplaying(false);

    // Filter the results as necessary by rating.
    if (self.minRating() > 0) {
      var placesArray = placesArray.filter(function(place) {
        return place.rating >= self.minRating();
      });
    };

    // Clear all current markers off the map.
    for (var i = 0; i < markersArray.length; i++) {
      markersArray[i].setMap(null);
    }

    // Clear the previous burgerPlaces Array.
    self.burgerPlaces.removeAll();

    // Clear previous heatMap data.
    self.heatMapData.removeAll();

    placesArray.forEach(function(place) {

      // Create a LatLng literal for each marker.
      var thisLatLng = new google.maps.LatLng(place.location.coordinate.latitude, place.location.coordinate.longitude);
      // Push this location to the heatMapData array.
      self.heatMapData.push({
        location: thisLatLng,
        weight: place.rating * 2000 // This will make higher rated establishments appear much "hotter" and brighter.
      });

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: "dist/img/food-icon.png",
        title: place.name,
        position: thisLatLng,
        animation: google.maps.Animation.DROP,
        infoWindowContent: '<div class="infowindow-container"><h4 class="infowindow-placeName">' + place.name + '</h4>' +
                            '<img class="infowindow-image" src="' + place.image_url + '" alt="' + place.name + '">' +
                            '<p class="infowindow-snippet">' + place.snippet_text + '</p>' +
                            '<p class="infowindow-phone">Tel: ' + place.display_phone + '</p>' +
                            '<img src="' + place.rating_img_url_large + '" alt="' + place.rating + ' stars"><span class="click-message">Click icon to keep open</span></div>'
      });

      // Add mouseover and mouseout listeners
      marker.addListener('mouseover', function() {
        mainInfoWindow.setContent(this.infoWindowContent);
        mainInfoWindow.open(map, this);
      });

      marker.addListener('mouseout', function() {
        mainInfoWindow.close();
      });

      marker.addListener('click', function() {
        fullDetailInfoWindow.setContent(this.infoWindowContent);
        fullDetailInfoWindow.open(map, this);
      });

      // Extend the current bounds object buy the LatLng of the current marker.
      bounds.extend(thisLatLng);

      markersArray.push(marker);
      self.burgerPlaces.push(marker);
    });

    // Once loop has completed fit the map to the adjusted bounds object and center the map accordingly.
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());

    // If a heatMap already has been drawn then remove it from the map.
    if (heatMap) {
      heatMap.setMap(null);
    }

    // Then load up a new heatMapObject, based on the heatMapData array and display it on the map.
    heatMap = new google.maps.visualization.HeatmapLayer({
      data: self.heatMapData(),
      radius: 80,
      gradient: ['transparent', 'rgb(57, 73, 107)', 'maroon']
    });

    // Display the new heatMap data on the map.
    heatMap.setMap(map);

    self.resultsDisplaying(true);

    if (self.filterOpenMobile()) {
      self.toggleFilterMobile();
    }

  }
}

ko.applyBindings(new viewModel());
