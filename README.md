# Your Sofia API / Твоята София API

[![License: EUPL 1.2](https://img.shields.io/badge/License-EUPL%201.2-blue.svg)](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
[![Build Docker Image](https://github.com/sofia-municipality/your-sofia-api/actions/workflows/docker-build.yml/badge.svg)](https://github.com/sofia-municipality/your-sofia-api/actions/workflows/docker-build.yml)
[![Tests](https://github.com/sofia-municipality/your-sofia-api/actions/workflows/tests.yml/badge.svg)](https://github.com/sofia-municipality/your-sofia-api/actions/workflows/tests.yml)
[![Payload CMS](https://img.shields.io/badge/Payload%20CMS-3.59-000000)](https://payloadcms.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-20-000000?logo=next.js)](https://nextjs.org/)

The backend API for **Your Sofia** mobile application. Built with Payload CMS 3.0, this bilingual (Bulgarian/English) content management system powers city services, news, and civic engagement features for Sofia residents.

[🇧🇬 Прочети на български](README.bg.md) | [🤝 Contributing](CONTRIBUTING.md) | [📋 Issues](https://github.com/sofia-municipality/your-sofia-api/issues)

---

## Table of Contents

- [Motivation](#motivation)
- [Features](#core-features)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgments)

---

## Motivation

**Your Sofia** is a mobile application for the residents of Sofia. The main motivation is **creating a better living environment through active interaction between citizens and administration**. This project welcomes contributions from developers, designers, and all community members who share the vision of transparent and accessible city services.

### Core Principles

- **Caring for citizens** through information, notifications based on interests and location, inclusion in surveys and voting on city projects
- **Caring for the urban environment** through submitting signals about the state of the urban environment, presenting a map with city objects
- **Caring for efficient city administration** through internal interfaces for easier citizen service, signal processing, and notification management

Guiding Rules:

- **Open Source First**: Every line of code is open for inspection, improvement, and contribution
- **Citizen-Centric**: We prioritize the real needs of city residents
- **Privacy-Respecting**: We don't require personal data for functionalities that can work without them. We don't require registration if we can work with anonymous unique identifiers. For functionalities working with personal data, we encrypt and don't store anything in plain text
- **Bilingual by Design**: Bulgarian is the primary language, with full English support
- **Community-Driven**: Built by the community, for the community

## Core Features

### For Users

1. **📰 Staying Informed**
   - Receiving news and notifications about city events
   - Filtering by topics (festivals, infrastructure, emergencies, announcements)
   - Location-based news with interactive maps
   - Push notifications for important updates

2. **🗺️ City Navigation**
   - Viewing city objects on interactive maps
   - Finding waste containers and recycling points
   - Viewing real-time air quality data
   - Discovering public services and facilities

3. **🤝 Participating in City Development**
   - Reporting infrastructure problems (damaged containers, missing lids, overflow)
   - Tracking contributions with personal statistics
   - Anonymous reporting system respecting privacy
   - Voting in city surveys and initiatives (coming soon)

### For Administrators

- 🛠️ **Content Management**: Admin panel for news and media
- 🌐 **Localization Support**: Creating content in Bulgarian and English
- **Access Control**: Support for different administrator role types
- � **Spatial Data Integrations**: PostgreSQL with PostGIS for spatial data

---

## Contributing

We welcome contributions from everyone! Whether you're fixing a bug, adding a feature, improving documentation, or translating content, your help makes **Your Sofia** better for all citizens.

### How to Contribute

1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Check the [Code of Conduct](CONTRIBUTING.md#code-of-conduct)
3. Browse [open issues](https://github.com/sofia-municipality/your-sofia-api/issues)
4. Submit your contribution via Pull Request

### Quick Contribution Guidelines

- 🐛 **Report bugs**: Open an issue with reproduction steps
- 💡 **Suggest features**: Describe the problem and proposed solution
- 🔧 **Submit code**: Fork, create a branch, make changes, open PR
- 📖 **Improve documentation**: Fix typos, add examples, clarify instructions
- 🌍 **Translate**: Help with Bulgarian/English translations

For detailed instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

This project is licensed under the **European Union Public License (EUPL) v1.2**.

### What This Means

- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ✅ Compatible with GPL, AGPL, MPL, and other open source licenses
- ❗ If you distribute modified versions, you must share the source code under EUPL
- ❗ You must keep all copyright notices intact
- ❗ No warranty is provided

### Full License

- **English**: [LICENSE](LICENSE) | [Official EUPL Text](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
- **Bulgarian**: See [LICENSE](LICENSE) for summary

For questions about licensing, visit the [EUPL FAQ](https://joinup.ec.europa.eu/collection/eupl/how-use-eupl).

---

## Acknowledgments

- **Sofia Municipality**: For supporting open civic technology
- **Contributors**: Everyone who has helped improve this project
- **Expo Team**: For the amazing React Native framework
- **Payload CMS**: For the powerful headless CMS
- **Open Source Community**: For the tools and libraries we build upon

---

Created with ❤️ for Sofia | Made with ❤️ for Sofia
