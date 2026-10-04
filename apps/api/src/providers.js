export const providerRegistry = {
  career: [
    { id: 'linkedin', name: 'LinkedIn', mode: 'oauth_or_approved_browser', live: false },
    { id: 'naukri', name: 'Naukri', mode: 'provider_session_or_deeplink', live: false },
    { id: 'company-careers', name: 'Company Careers', mode: 'web_or_api', live: false }
  ],
  cabs: [
    { id: 'uber', name: 'Uber', mode: 'provider_api_or_deeplink', live: false },
    { id: 'ola', name: 'Ola', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'rapido', name: 'Rapido', mode: 'provider_integration_or_deeplink', live: false }
  ],
  travel: [
    { id: 'makemytrip', name: 'MakeMyTrip', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'cleartrip', name: 'Cleartrip', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'airline-direct', name: 'Airline Direct', mode: 'approved_api_or_deeplink', live: false }
  ],
  movies: [
    { id: 'bookmyshow', name: 'BookMyShow', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'district', name: 'District', mode: 'provider_integration_or_deeplink', live: false }
  ],
  shopping: [
    { id: 'amazon-in', name: 'Amazon India', mode: 'deeplink_or_affiliate_api', live: false },
    { id: 'flipkart', name: 'Flipkart', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'brand-direct', name: 'Brand Direct', mode: 'web_or_api', live: false }
  ],
  food: [
    { id: 'swiggy', name: 'Swiggy', mode: 'provider_integration_or_deeplink', live: false },
    { id: 'zomato', name: 'Zomato', mode: 'provider_integration_or_deeplink', live: false }
  ],
  email: [{ id: 'gmail', name: 'Gmail', mode: 'oauth', live: false }],
  calendar: [{ id: 'google-calendar', name: 'Google Calendar', mode: 'oauth', live: false }],
  health: [{ id: 'health-provider', name: 'Healthcare Provider', mode: 'provider_api_or_deeplink', live: false }],
  cars: [{ id: 'cars24', name: 'Cars24', mode: 'provider_integration_or_deeplink', live: false }, { id: 'spinny', name: 'Spinny', mode: 'provider_integration_or_deeplink', live: false }]
};

export const domains = [
  ['career', /job|career|cv|resume|application|interview|naukri|linkedin/i],
  ['cabs', /cab|taxi|uber|ola|rapido|ride/i],
  ['travel', /flight|hotel|travel|trip|visa|train|bus/i],
  ['movies', /movie|cinema|ticket|show|bookmyshow|district/i],
  ['shopping', /shop|buy|product|deal|price|amazon|flipkart/i],
  ['food', /food|restaurant|delivery|swiggy|zomato/i],
  ['email', /email|mail|reply|inbox/i],
  ['calendar', /calendar|meeting|schedule/i],
  ['health', /doctor|health|clinic|appointment/i],
  ['cars', /car|vehicle|sell my car|buy a car/i]
];

export function domainOf(text = '') {
  return (domains.find(([, matcher]) => matcher.test(text)) || ['general'])[0];
}
