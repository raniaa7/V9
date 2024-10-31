/**
 * Gefið efni fyrir verkefni 9, ekki er krafa að nota nákvæmlega þetta en nota
 * verður gefnar staðsetningar.
 */

import { el, empty } from './lib/elements.js';
import { weatherSearch } from './lib/weather.js';

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  { title: 'Reykjavík', lat: 64.1355, lng: -21.8954 },
  { title: 'Akureyri', lat: 65.6835, lng: -18.0878 },
  { title: 'New York', lat: 40.7128, lng: -74.006 },
  { title: 'Tokyo', lat: 35.6764, lng: 139.65 },
  { title: 'Sydney', lat: 33.8688, lng: 151.2093 },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector('.output');

  if (!outputElement) {
    console.warn('fann ekki .output');
    return;
  }

  empty(outputElement);
  outputElement.appendChild(element);
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, results) {
  const header = el(
    'tr',
    {},
    el('th', {}, 'Tími'),
    el('th', {}, 'Hiti'),
    el('th', {}, 'Úrkoma'),
  );

  const bodyRows = results.map(result => {
    const date = new Date(result.time); // Assuming result.time holds the datetime string
    const formattedTime = date.toLocaleString('is-IS', { // Format according to Icelandic locale
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
      hour12: false,
    });

    const temperature = result.temperature !== undefined ? `${result.temperature} °C` : 'N/A'; // Ensure temperature is displayed
    const precipitation = result.precipitation ? `${result.precipitation} mm` : 'Engin úrkoma'; // If no precipitation, show "No Rain"

    return el(
      'tr',
      {},
      el('td', {}, formattedTime),
      el('td', {}, temperature),
      el('td', {}, precipitation)
    );
  });

  const resultsTable = el('table', { class: 'forecast' }, header, ...bodyRows);

  renderIntoResultsContent(
    el(
      'section',
      {},
      el('h2', {}, `Leitarniðurstöður fyrir: ${location.title}`),
      resultsTable,
    ),
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  console.log(error);
  const message = error.message;
  renderIntoResultsContent(el('p', {}, `Villa: ${message}`));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el('p', {}, 'Leita...'));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, results ?? []);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const location = {
        title: 'Mín staðsetning',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      await onSearch(location);
    }, (error) => {
      renderError(error);
    });
  } else {
    renderError(new Error('Geolocation is not supported by this browser.'));
  }
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  return el(
    'li',
    { class: 'locations__location' },
    el(
      'button',
      { class: 'locations__button', click: onSearch },
      locationTitle,
    ),
  );
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  const parentElement = document.createElement('main');
  parentElement.classList.add('weather');

  const headerElement = document.createElement('header');
  const heading = document.createElement('h1');
  heading.appendChild(document.createTextNode('Veðurspá'));
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  const locationsElement = document.createElement('div');
  locationsElement.classList.add('locations');

  const locationsListElement = document.createElement('ul');
  locationsListElement.classList.add('locations__list');

  for (const location of locations) {
    const liButtonElement = renderLocationButton(location.title, () => {
      console.log('Halló!!', location);
      onSearch(location);
    });
    locationsListElement.appendChild(liButtonElement);
  }

  // Add button for searching current location
  const myLocationButton = renderLocationButton('Fá veðurspá fyrir minn stað', onSearchMyLocation);
  locationsListElement.appendChild(myLocationButton);

  locationsElement.appendChild(locationsListElement);
  parentElement.appendChild(locationsElement);

  const outputElement = document.createElement('div');
  outputElement.classList.add('output');
  parentElement.appendChild(outputElement);

  container.appendChild(parentElement);
}

// Þetta fall býr til grunnviðmót og setur það í `document.body`
render(document.body, locations, onSearch, onSearchMyLocation);
