# Epitech Addons

<div align="center">
  
![Epitech Addons](https://img.shields.io/badge/Epitech-Addons-5D5FEF?style=for-the-badge&logo=firefox&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
![Python](https://img.shields.io/badge/python-3.9%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![Contributors](https://img.shields.io/github/contributors/epitech-addons/epitech-addons?style=for-the-badge&color=0CD68A)

</div>

<div align="center">
  <img src="static/images/icon.png" alt="Epitech Addons Logo" width="120px">
  <h3>Browser extensions designed to enhance the Epitech student experience</h3>
</div>

## 🌟 Overview

Epitech Addons is an open-source platform providing browser extensions and tools specifically designed for Epitech students. Our mission is to enhance productivity, improve academic performance, and make the Epitech experience more efficient and enjoyable.

The platform consists of a backend service that delivers extensions, tracks usage analytics, and provides an API for our extensions, along with a frontend interface where students can discover and download our tools.

<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Epitech Addons Dashboard" width="80%">
</div>

## 🚀 Features

- **Extension Distribution**: Simple, secure distribution of browser extensions
- **Analytics Dashboard**: Anonymous usage statistics to guide development priorities
- **RESTful API**: Support for our browser extensions to interact with backend services
- **Authentication**: Epitech account integration for personalized experiences
- **Cross-Browser Support**: Extensions available for Firefox, Chrome, Edge, and other Chromium-based browsers

## 📦 Extensions

### Enhanced Mouli

Get detailed skill tracking, visual progress, and focus recommendations to improve your scores faster on Epitech's Moulinette.

- **Detailed Skill Breakdown**: See progress on individual skills and tests
- **Focus Recommendations**: Smart suggestions on which skills to prioritize
- **Visual Progress Tracking**: Beautiful, color-coded progress visualizations
- **Coverage Metrics**: Track branch and line coverage for your projects

<div align="center">
  <img src="docs/screenshots/enhanced-mouli.png" alt="Enhanced Mouli Screenshot" width="80%">
</div>

### More Coming Soon!

We're actively developing additional extensions to further enhance the Epitech experience. Stay tuned for updates!

## 🔧 Installation & Setup

### Prerequisites

- Python 3.9+
- pip
- virtualenv (recommended)
- PostgreSQL (or SQLite for development)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/epitech-addons/epitech-addons.git
cd epitech-addons

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env file with your configuration

# Initialize the database
flask db init
flask db migrate
flask db upgrade

# Run the development server
flask run
```

### Development Environment

The development server will start at http://localhost:5000.

```
# Directory structure
epitech-addons/
├── app/                  # Main application package
│   ├── api/              # API endpoints
│   ├── auth/             # Authentication logic
│   ├── extensions/       # Extension management
│   ├── models/           # Database models
│   ├── static/           # Static assets
│   ├── templates/        # Jinja2 templates
│   └── utils/            # Helper utilities
├── config/               # Configuration files
├── migrations/           # Database migrations
├── tests/                # Test suite
├── .env                  # Environment variables
├── requirements.txt      # Dependencies
└── run.py                # Application entry point
```

## 🧪 Testing

```bash
# Run unit tests
pytest

# Run with coverage report
pytest --cov=app
```

## 📚 API Documentation

API documentation is available at `/api/docs` when running the server. Authentication is required for most endpoints.

### Main Endpoints

- `GET /api/extensions`: List all available extensions
- `GET /api/extensions/<id>`: Get specific extension details
- `GET /api/extensions/<id>/download`: Download an extension
- `POST /api/metrics`: Submit anonymous usage metrics

## 🤝 Contributing

We welcome contributions from the Epitech community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Check out our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 🔧 Development Guidelines

- Follow PEP 8 style guide for Python code
- Use descriptive variable names and comments
- Write tests for new features
- Update documentation when necessary

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/username1">
          <img src="https://github.com/identicons/username1.png" width="100px;" alt="Developer 1"/>
          <br />
          <sub><b>Developer 1</b></sub>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/username2">
          <img src="https://github.com/identicons/username2.png" width="100px;" alt="Developer 2"/>
          <br />
          <sub><b>Developer 2</b></sub>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/username3">
          <img src="https://github.com/identicons/username3.png" width="100px;" alt="Developer 3"/>
          <br />
          <sub><b>Developer 3</b></sub>
        </a>
      </td>
    </tr>
  </table>
</div>

## 📞 Contact

- GitHub: [github.com/epitech-addons](https://github.com/epitech-addons)
- Email: contact@epitechaddons.com
- Twitter: [@EpitechAddons](https://twitter.com/EpitechAddons)

## 🙏 Acknowledgements

- [Epitech](https://www.epitech.eu/) for creating the challenging environment that inspired these tools
- All contributors who have helped improve the project
- The open-source community for providing amazing libraries and frameworks

---

<div align="center">
  <p>Made with ❤️ by Epitech Students for Epitech Students</p>
</div>
