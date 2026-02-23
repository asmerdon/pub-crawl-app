# Pub Crawl Planner

A React web application that helps users plan and visualize pub crawls using open-source mapping services. The app allows users to discover nearby pubs, generate optimized walking routes between them, and plan their perfect night out.

## What This Project Aims To Do

The Pub Crawl Planner is designed to solve the common problem of organizing group outings to multiple pubs. Instead of manually researching locations and figuring out the best route, users can:

- **Discover Pubs**: Find nearby pubs based on location or along a specific route
- **Plan Routes**: Generate optimized walking routes between selected pubs
- **Visualize Plans**: See the entire pub crawl on an interactive map
- **Optimize Experience**: Get the most efficient path to visit multiple venues

## Key Features

- **Interactive OpenStreetMap**: Full-featured map interface powered by Leaflet
- **Smart Pub Discovery**: Find pubs within a 500-meter radius or along specific routes using OpenStreetMap data
- **Route Optimization**: Automatically calculate the best walking path between pubs using OSRM
- **Pub Information**: Display addresses and details for each venue
- **No API Keys Required**: Uses free, open-source services (Nominatim, Overpass API, OSRM)
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- **No API keys needed!** The app uses free open-source services.

### Installation
1. Clone the repository and run `npm install`.
2. Start the app: `npm start`

That's it! No API keys, no billing setup, no configuration needed.

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Maps**: Leaflet with react-leaflet (OpenStreetMap tiles)
- **Geocoding**: Nominatim (OpenStreetMap geocoding service)
- **POI Search**: Overpass API (OpenStreetMap data query)
- **Routing**: OSRM (Open Source Routing Machine)
- **Styling**: CSS with modern design
- **Build Tool**: Create React App

## Services Used

All services are **free and open-source**, with no API keys required:

- **Nominatim**: Geocoding (address → coordinates). Rate limit: ~1 request/second.
- **Overpass API**: Pub/POI search. No rate limit for reasonable use.
- **OSRM**: Walking route calculation. Public instance available.

**Note**: For production use with high traffic, consider self-hosting these services or using commercial alternatives.

## Current Status

This is a working prototype that demonstrates the core functionality. The app successfully:
- Loads and displays OpenStreetMap via Leaflet
- Finds nearby pubs using Overpass API
- Generates walking routes between pubs using OSRM
- Displays pub information in interactive markers

## Future Enhancements

- User authentication and saved pub crawl plans
- Social features (sharing plans, group coordination)
- Advanced filtering (by pub type, rating, price range)
- Integration with pub websites for real-time information
- Mobile app version
- Offline map support
- Custom map tile styling

## Usage

1. **Set Your Location**: Enter a starting point (e.g., "Holborn, London") or specify start and end locations
2. **Find Pubs**: The app automatically searches for nearby pubs
3. **Plan Your Crawl**: The app generates an optimized walking route connecting the pubs
4. **Explore Details**: Click on pub markers to see addresses and details
5. **Follow the Route**: Use the generated route line to navigate between venues

## Contributing

This project is open for contributions! Whether you want to add new features, improve the UI, or fix bugs, feel free to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with love for pub enthusiasts everywhere - now powered by open-source!*
