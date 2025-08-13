# Techcast-Task
A task completed for my job application at [Techcast GmbH](https://www.techcast.com/).

## Setup

Run `npm run build-win` to build the project on windows.<br>
Run `npm run build-mac` to build the project on macOS.<br>
Note that the build process on mac has **not** been tested - but it *should* work.

To ensure functionality out of the box, a full build is included in this repository.<br>
The above build commands are therefore optional.

Run `npm start` to start the service.<br>
The client is then accessible at your [localhost](http://localhost:3000).<br>
The admin interface can be accessed via [localhost/admin](http://localhost:3000/admin).

The admin password for this demonstration is `techcastadmin`.

## Explanation

As this task is minor in scope, no frontend framework was utilised to reduce unnecessary bloat and overall complexity.<br>
A rudimentary build process using a CSS minifier and webpack was set up to produce *somewhat* optimal production ready files. CSS and JS injection was left out of the procedure to not only simplify the setup but also cater to the more modern web developer wisdom of serving multiple small files instead of one larger one.<br>
All styling is custom made.<br>
Icons sourced from [SVG Repo](https://www.svgrepo.com/).

## Disclaimer

Stale information resulting from a server restart currently results in undefined behaviour.<br>
While the admin panel should work correctly, even if the frontend tab has not been reloaded, the client interface will contain old chat and push messages. These go away if the tab is reloaded. Fixing this issue would require detecting server resets to trigger message history reloads.

Client user names are generated based on the random socket id provided to the server.<br>
I take no responsibility for inappropriate character combinations.