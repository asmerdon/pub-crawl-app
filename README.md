# Pub Crawl Planner

A React web application that helps users plan and visualize pub crawls using Google Maps integration. The app allows users to discover nearby pubs, generate optimized walking routes between them, and plan their perfect night out.

## What This Project Aims To Do

The Pub Crawl Planner is designed to solve the common problem of organizing group outings to multiple pubs. Instead of manually researching locations and figuring out the best route, users can:

- **Discover Pubs**: Find nearby pubs based on location or along a specific route
- **Plan Routes**: Generate optimized walking routes between selected pubs
- **Visualize Plans**: See the entire pub crawl on an interactive map with turn-by-turn directions
- **Optimize Experience**: Get the most efficient path to visit multiple venues

## Key Features

- **Interactive Google Maps**: Full-featured map interface with custom styling
- **Smart Pub Discovery**: Find pubs within a 500-meter radius or along specific routes
- **Route Optimization**: Automatically calculate the best walking path between pubs
- **Pub Information**: Display ratings, addresses, and details for each venue
- **Custom Map Styling**: Clean interface that emphasizes transit and hides unnecessary POIs
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Google Maps API key with Places and Directions APIs enabled

### Installation
1. Clone the repository and run `npm install`.
2. Copy `.env.example` to `.env` and add your [Google Maps API key](https://console.cloud.google.com/):
   ```bash
   cp .env.example .env
   ```
   Then set `REACT_APP_GOOGLE_MAPS_API_KEY` in `.env`. Enable **Maps JavaScript API**, **Places API**, and **Directions API** for the key. The "For development purposes only" watermark is shown until billing is enabled on your Google Cloud project.
3. Start the app: `npm start`

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Maps**: Google Maps JavaScript API with @react-google-maps/api
- **Styling**: CSS with custom map styling
- **Build Tool**: Create React App

## Current Status

This is a working prototype that demonstrates the core functionality. The app successfully:
- Loads and displays Google Maps
- Finds nearby pubs using the Places API
- Generates walking directions between pubs
- Displays pub information in interactive markers

## Future Enhancements

- User authentication and saved pub crawl plans
- Social features (sharing plans, group coordination)
- Advanced filtering (by pub type, rating, price range)
- Integration with pub websites for real-time information
- Mobile app version
- Offline map support

## Usage

1. **Set Your Location**: Enter a starting point or use your current location
2. **Find Pubs**: Search for nearby pubs or specify a route area
3. **Plan Your Crawl**: The app will automatically generate an optimized walking route
4. **Explore Details**: Click on pub markers to see ratings, addresses, and more
5. **Follow the Route**: Use the generated directions to navigate between venues

## Contributing

This project is open for contributions! Whether you want to add new features, improve the UI, or fix bugs, feel free to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with love for pub enthusiasts everywhere*
