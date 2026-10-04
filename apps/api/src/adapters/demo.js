import { randomUUID } from 'node:crypto';

const fixtures = {
  career: [
    ['LinkedIn', 'Head of Talent Acquisition', '94% fit', 'Recommended'],
    ['Naukri', 'Talent Acquisition Lead', '91% fit', 'Strong match'],
    ['Company Careers', 'Head of People India', '88% fit', 'Review']
  ],
  cabs: [
    ['Rapido', 'Cab Economy', '₹438 · 4 min', 'Best price'],
    ['Ola', 'Mini', '₹449 · 6 min', '₹11 more'],
    ['Uber', 'Go', '₹462 · 3 min', 'Fastest']
  ],
  travel: [
    ['Cleartrip', 'Comparable itinerary', '₹5,420', 'Best effective price'],
    ['MakeMyTrip', 'Comparable itinerary', '₹5,510', 'Better timing'],
    ['Airline Direct', 'Same flight', '₹5,590', 'Direct booking']
  ],
  movies: [
    ['BookMyShow', '7:40 PM · PVR', '₹520 effective', 'Best with eligible offer'],
    ['District', '7:50 PM · PVR', '₹610', 'Alternative']
  ],
  shopping: [
    ['Amazon India', 'Matched product', '₹4,899', 'Fast delivery'],
    ['Flipkart', 'Matched product', '₹4,749', 'Best price']
  ],
  food: [
    ['Swiggy', 'Matched basket', '₹612', 'Fastest'],
    ['Zomato', 'Matched basket', '₹574', 'Best total']
  ]
};

export function demoCompare(domain) {
  return (fixtures[domain] || []).map((row, index) => ({
    id: randomUUID(), provider: row[0], title: row[1], value: row[2], note: row[3],
    rank: index + 1, live: false, source: 'demo-adapter'
  }));
}
