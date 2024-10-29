// main.js
import { sendSearchRequest } from './search.js';

document.getElementById('search-button').addEventListener('click', sendSearchRequest);
document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevents the default form submission if inside a form
      document.getElementById('search-button').click(); // Triggers the search button click
    }
  });
  