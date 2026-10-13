What the tests currently verify

The current setup checks that:

The landing page loads correctly.

The search box, search button, filters, finder panel, location list, and map zoom controls are visible.

The About tooltip opens and closes.

The Learn More link goes to the Resources page.

Keyword search works.

ZIP code searches update the mileage values.

Multiple Philadelphia ZIP codes update the distance/mileage list.

Gauge, Camera, and All filters can be selected.

Map zoom controls work.

Imagery toggle works.

Show my location button works.

Footer links are visible.

Added two beginner-friendly features.

First, the browser opens visibly and maximized instead of hidden/headless.

Second, added a banner at the top of the browser that shows the current test name, like:

Running test: Search can be cleared and reused with ZIP code mileage update

also added slowMo in the config so the test does not run too fast.
