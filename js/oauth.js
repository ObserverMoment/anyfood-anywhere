// var yelp_url = YELP_BASE_URL + 'business/' + self.selected_place().Yelp.business_id; Originally from MarkN - Udacity
var yelp_url = 'https://api.yelp.com/v2/search' ; // Hard coded for testing

    var parameters = {
      oauth_consumer_key: "hpyDJOKR7-Emfyjx1F_WGg", // YELP_KEY
      oauth_token: "gkKuA7gpU51RGYIyrcFydv0lAFpMgIYI", //YELP_TOKEN
      oauth_nonce: Math.floor(Math.random() * 1e12).toString(),
      oauth_timestamp: Math.floor(Date.now()/1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version : '1.0',
      callback: 'cb',            // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
      location: 'Bristol',
      term: 'burger'
    };

    var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, "CJK7KYhrXSwpaDaWMyGyRmw8rLc", "7iPDx4-ccWv8zpo8gcautWhgO3Q");  // ('GET',yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
    parameters.oauth_signature = encodedSignature;

    var settings = {
      url: yelp_url,
      data: parameters,
      cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
      dataType: 'jsonp'
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings)
          .done(
            function(results) {
              // Do stuff with results
              console.log(results);
            }
          )
          .fail(
            function(msg) {
              // Do stuff on fail
              console.log("Some message?" + JSON.stringify(msg));
            }
          );
