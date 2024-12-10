// main.js
import { sendSearchRequest } from './search.js';


if ("serviceWorker" in navigator) {
  // register service worker
  navigator.serviceWorker.register("/service-worker.js");
}


document.getElementById('search-button').addEventListener('click', sendSearchRequest);
document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevents the default form submission if inside a form
      document.getElementById('search-button').click(); // Triggers the search button click
    }
  });
  