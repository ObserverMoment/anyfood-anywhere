# Welcome to Anything, Anywhere!

This is a simple web app that allows you to search for absolutely anything, in any location and get back a set of
results displayed both on a map and in list form. It is built using the Yelp search API and will return results from their database.

You can view the "finished" site at this [Git Page](https://observermoment.github.io/anything-anywhere/)

1. Type in what you want to look for.
2. Type in where you want to look for it (a city or town is best here - countries will not work).
3. Hit enter or click search!

## Heat Map?

Yes, the results will also display as a heat map so you can see which areas are best for your chosen search item! Higher rated establishments will glow brighter than low rated ones,
as will areas with lots of results close together will

## Mobile Use - Filtering and Searching

By default the search boxes, filter and results list will be hidden on smaller mobile devices to allow space for the map. If you want to view the search boxes, filter and results list, just click the buttons.

## Larger Devices - Results List

You can hover over individual results to see where they are - look for the bouncing icon on the map - and clicking on them will center the map on the selected place and pop open an info window.

### If you want to run this on your local machine.

1. Clone the git repository to a local folder.
2. Make sure you have npm and gulp installed.
3. run gulp install within the folder that you clones the project to. This should install all the necessary dependencies.
4. You can run Gulp at the command line (or gulp watch) if you wish to make changes to the files and then have them process instantly.
5. Open the index.html file in your browser.
