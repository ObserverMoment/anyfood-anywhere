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
    zoom: 14,
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
    icon: 'img/you-are-here.png',
    animation: google.maps.Animation.DROP
  });

}

var viewModel = function() {
  var self = this;

  // This will hold the current array of objects as returned from the yelp API call. Changes to this made by the filter (or by the user changing their location) will cause the markers to re-render.
  self.burgerPlaces = ko.observableArray();

  // When the user updates this the map will re-center and the yelp search will re-run.
  self.userLocation = ko.observable();

  self.meatType = ko.observable();

  // Linked to the submit bind of the search form. Gets the value and runs a geolocate call to get the LatLng.
  self.mapUpdate = function() {
    self.userLocation($('#userLocationInput').val());
    if ($('#meatTypeInput').val()) {
      self.meatType($('#meatTypeInput').val());
    }
    // Turn a search string into LatLng location.
    self.getUserGeolocation(self.userLocation());
    // Reset search inputs.
    $('#meatTypeInput').val('');
    $('#userLocationInput').val('');
  }

  self.getUserGeolocation = function() {
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( { address: self.userLocation() }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        // Reset the map and run the new yelp search
        console.log(results[0].geometry.location);
        map.setCenter(results[0].geometry.location);
        // Place the 'you are here marker'.
        youAreHereMarker.setPosition(results[0].geometry.location);
        // Run the yelpSearchAPI on the search string.
        self.yelpSearchAPI(self.userLocation(), self.meatType());
      } else {
        console.log("Sorry but we could not locate your location, please try a different search");
      }
    });
  }

  self.yelpSearchAPI = function(locationQuery, optionalQuery) {
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
      location: locationQuery,
      term: optionalQuery || 'meat'
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
          // Do stuff with results
          console.log(results);
          // Add create a knockout array from results.
          self.createMarkersFromArray(results.businesses)
        }).fail(
        function(msg) {
          // Do stuff on fail
          console.log("Some message?" + JSON.stringify(msg));
        });
  }

  self.createMarkersFromArray = function(placesArray) {

    // Clear all current markers off the map.
    for (var i = 0; i < markersArray.length; i++) {
      markersArray[i].setMap(null);
    }

    // Clear the original burgerPlaces Array.
    self.burgerPlaces.removeAll();

    placesArray.forEach(function(place) {

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: "img/bad_burger_sized.png",
        title: place.name,
        position: {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude},
        animation: google.maps.Animation.DROP
      });

      var infoWindowContent = '<div class="infowindow-container"><h4 class="infowindow-placeName">' + place.name + '</h4>' +
                              '<img class="infowindow-image" src="' + place.image_url + '" alt="' + place.name + '">' +
                              '<p class="infowindow-snippet">' + place.snippet_text + '</p>' +
                              '<p class="infowindow-phone">Tel: ' + place.display_phone + '</p>' +
                              '<img src="' + place.rating_img_url_large + '" alt="' + place.rating + ' stars"><span class="click-message">Hit Meat to Keep Open</span></div>';

      // Add mouseover and mouseout listeners
      marker.addListener('mouseover', function() {
        mainInfoWindow.setContent(infoWindowContent);
        mainInfoWindow.open(map, this);
      });

      marker.addListener('mouseout', function() {
        mainInfoWindow.close();
      });

      marker.addListener('click', function() {
        fullDetailInfoWindow.setContent(infoWindowContent);
        fullDetailInfoWindow.open(map, this);
      });


      markersArray.push(marker);
      self.burgerPlaces.push(marker);
    });
  }
}

ko.applyBindings(new viewModel());
