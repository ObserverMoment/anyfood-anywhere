// Google maps
// Some global variables and functions for use with the map that will need to be called by KO.
// The variable that will hold the google.maps Map object.
var map;

// The variable to hold the Google PlacesService object.
var placeServices;
var searchOptions; // The object that gets passed to PlacesService search.

// Variable to return LatLng from user address input
var geocoder;

var heatMap = null;

var mainInfoWindow;
var fullDetailInfoWindow;

// The main function that is called by the call to Google maps.
function initMap() {
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

  google.maps.event.addListener(fullDetailInfoWindow,'closeclick',function(){
    if (myViewModel.animatedIcon) {
      myViewModel.animatedIcon.setAnimation(null);
    }
  });

  myViewModel.getDataFromAPI();

}

// A place object constructor. There will be an array of these markers which will be displayed on the map and in the list view.
var Place = function(data, infoWindowContent, marker, latLng) {
  var self = this;
  self.id = data.id;
  self.name = data.name;
  self.phone = data.display_phone;
  self.image = data.image_url;
  self.review_snippet = data.snippet_text;
  self.rating = data.rating;
  self.rating_img = data.rating_img_url_large;
  self.location = latLng;
  self.marker = marker;
}

// viewModel
var ViewModel = function() {
  var self = this;

  // The two search fields.
  self.foodType = ko.observable('Burgers');
  self.userLocation = ko.observable('Bristol');

  // Only allow the user to click when they have entered some value into both search fields.
  self.enableSearch = ko.computed(function() {
    return self.foodType() && self.userLocation();
  }, this);

  // Observables to hold the filtering values.
  self.minRating = ko.observable(0); //Default to 0
  self.filterText = ko.observable();

  // DOM elements for holding results should not display until there are results received.
  self.resultsDisplaying = ko.observable(true);
  self.isFilterOpen = ko.observable(false);
  self.showingSearchBoxes = ko.observable(false);

  // Open and close the filter pane when on a mobile device.
  self.toggleFilter = function() {
    self.isFilterOpen(!self.isFilterOpen());
  }

  // Show and hide the search boxes when on a mobile device.
  self.toggleSearchBoxes = function() {
    self.showingSearchBoxes(!self.showingSearchBoxes());
  }

  // Array of Place objects that will display on the map / list and be filterable.
  self.placesArray = ko.observableArray([]);

  // Generate a filtered array based on the minRating and the textSearch
  self.filteredArray = ko.computed(function() {
    return ko.utils.arrayFilter(self.placesArray(), function(place) {
      // Set a variable ratingOK which will be a boolean depending on whether the place.rating is high enough.
      var ratingOK = place.rating > self.minRating();
      // Set a variable textSearchOK which will be a boolean depending on whether the text search matches anything in the place object.
      var textSearchOK = true;
      if (self.filterText()) {
        // Make the users input and the place data all lowercase so they match.
        var searchString = self.filterText().toLowerCase();
        if ( place.id.toLowerCase().indexOf(searchString) == -1 && place.name.toLowerCase().indexOf(searchString) == -1) {
          textSearchOK = false;
        }
      }

      // A variable to check if both filter requirements are met.
      var showPlace = ratingOK && textSearchOK;
      place.marker.setVisible(showPlace);
      // Then return true to the filter if the place rating is higher than min rating.
      return showPlace;
    })
  })

  // An array to hold the heatmap data.
  self.heatMapData = ko.observableArray();

  self.animatedIcon;

  // Animations and re-center map when the filter results are clicked or hovered.
  self.animateIcon = function() {
    // If we have previously animated a marker, stop animating it.
    if (self.animatedIcon) { self.animatedIcon.setAnimation(null) };
    this.marker.setAnimation(google.maps.Animation.BOUNCE);
  }

  self.stopAnimateIcon = function() {
    this.marker.setAnimation(null);
  }

  self.zoomToRestaurant = function() {
    // Move the map to the location of the marker, zoom in a bit, animate it, store it as bouncingIcon.
    map.setCenter(this.marker.position);

    // Fill the main infoWindow and then open it.
    fullDetailInfoWindow.setContent(this.marker.infoWindowContent);
    fullDetailInfoWindow.open(map, this.marker);
  }

  // When the search button is clicked this will run.
  self.getDataFromAPI = function() {
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
      location: self.userLocation() || 'bristol',
      term: self.foodType() || 'burgers'
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
          self.createPlacesArray(results.businesses)
        }).fail(function(msg) {
          alert("Failed because (need to display error as DOM element)" + JSON.stringify(msg));
        });
  }

  self.removeAllMarkers = function() {
    ko.utils.arrayForEach(self.placesArray(), function(place) {
      place.marker.setMap(null);
    })
  }

  self.createPlacesArray = function(data) {

    // Create a new map bounds object.
    var bounds = new google.maps.LatLngBounds();

    // Clear the previous placesArray.
    self.removeAllMarkers();
    self.placesArray.removeAll();

    // Clear previous heatMap data.
    self.heatMapData.removeAll();

    // If a heatMap already has been drawn then remove it from the map.
    if (heatMap) {
      heatMap.setMap(null);
    }

    // Loop through the data and create the Places objects and add them to the placesArray.
    data.forEach(function(place) {
      // Create a LatLng literal for each marker.
      var thisLatLng = new google.maps.LatLng(place.location.coordinate.latitude, place.location.coordinate.longitude);

      // Push this location data to the heatMapData array.
      self.heatMapData.push({
        location: thisLatLng,
        weight: place.rating * 2000 // This will make higher rated establishments appear much "hotter" and brighter.
      });

      // Create the infoWindow details - checking that the various attributes are present in the object received from Yelp.
      var infoWindowContent = '';
      if (place.name) { infoWindowContent += '<div class="infowindow-container"><h4 class="infowindow-placeName">' + place.name + '</h4>'; }
      if (place.image_url) { infoWindowContent += '<img class="infowindow-image" src="' + place.image_url + '" alt="' + place.name + '">'; }
      if (place.snippet_text) { infoWindowContent += '<p class="infowindow-snippet">' + place.snippet_text + '</p>'; }
      if (place.display_phone) { infoWindowContent += '<p class="infowindow-phone">Tel: ' + place.display_phone + '</p>'; }
      if (place.rating_img_url_large && place.rating > 0) { infoWindowContent += '<img src="' + place.rating_img_url_large + '" alt="' + place.rating + ' stars">'; }
      infoWindowContent += '<span class="click-message">Click icon to keep open</span></div>';

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: "dist/img/food-icon.png",
        title: place.name,
        position: thisLatLng,
        animation: google.maps.Animation.DROP,
        infoWindowContent: infoWindowContent
      });

      // Add click, mouseover and mouseout listeners
      marker.addListener('mouseover', function() {
        mainInfoWindow.setContent(this.infoWindowContent);
        mainInfoWindow.open(map, this);
      });

      marker.addListener('mouseout', function() {
        mainInfoWindow.close();
      });

      marker.addListener('click', function() {
        // If we have previously animated a marker, stop animating it.
        if (self.animatedIcon) { self.animatedIcon.setAnimation(null) };
        fullDetailInfoWindow.setContent(this.infoWindowContent);
        fullDetailInfoWindow.open(map, this);
        this.setAnimation(google.maps.Animation.BOUNCE);
        // Save the active marker in a variable so as to ensure that only one marker at a time is animated.
        self.animatedIcon = this;
      });

      // Extend the current bounds object buy the LatLng of the current marker.
      bounds.extend(thisLatLng);

      self.placesArray.push( new Place(place, infoWindowContent, marker, thisLatLng) );
    })
    // Once loop has completed fit the map to the adjusted bounds object and center the map accordingly.
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());

    // Then load up a new heatMapObject, based on the heatMapData array and display it on the map.
    heatMap = new google.maps.visualization.HeatmapLayer({
      data: self.heatMapData(),
      radius: 80,
      gradient: ['transparent', 'rgb(57, 73, 107)', 'maroon']
    });

    // Display the new heatMap data on the map.
    heatMap.setMap(map);

    // Reset the search box placeholder text.
    self.foodType('');
    self.userLocation('');
  }

}

var myViewModel = new ViewModel();
ko.applyBindings(myViewModel);
