# Moviola Digest

Moviola Digest is an Electron application designed to convert videos for use with the Moviola Video Editor XR app. This tool streamlines the video conversion process, ensuring compatibility and optimal performance within the Moviola Video Editor environment.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Downloading Release Binaries

1. Navigate to the [Releases](https://github.com/kevinagnes/moviola-digest/releases) page of the repository.
2. Download the appropriate release binary for your operating system:
    - **Windows**: `MoviolaDigest-Setup-x64.exe`
    - **MacOS**: `MoviolaDigest-darwin-x64.zip` or `MoviolaDigest-darwin-arm64.zip` (depending on your architecture)


3. Follow the standard installation procedures for your operating system:
    - **Windows**: Run the `.exe` file and follow the on-screen instructions.
    - **MacOS**: Unzip the downloaded file and move the application to your `Applications` folder.

### Building from Source

1. Clone the repository:
    ```bash
    git clone https://github.com/xrdevbr/moviola-digest.git
    cd moviola-digest
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the application:
    ```bash
    npm run start
    ```

## Usage

1. **Launch the Application**: Open Moviola Digest using the installed binary or by running `npm run start` from the source directory.

2. **Drag and Drop Videos**: Drag and drop your video files into the designated area in the application window.

3. **Configure Settings** (optional): Click on the "Settings" button to configure hardware encoding, smart scaling, video quality, resolution, and whether to burn timecode into the video.

4. **Start Conversion**: Click the "Start" button to begin converting your videos. Progress will be displayed via the progress bar and status messages.

5. **Transfer to Quest**: Once conversion is complete, connect your Quest device via USB and press the "Continue" button to upload the converted videos to your Quest device.

## Contributing

We welcome contributions from the community! Here’s how you can get involved:

1. **Fork the Repository**: Click on the "Fork" button at the top right corner of this repository's page.

2. **Clone Your Fork**:
    ```bash
    git clone https://github.com/your-username/moviola-digest.git
    cd moviola-digest
    ```

3. **Create a New Branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```

4. **Make Your Changes**: Implement your feature or bug fix.

5. **Commit Your Changes**:
    ```bash
    git commit -m "Description of the feature or fix"
    ```

6. **Push to Your Fork**:
    ```bash
    git push origin feature/your-feature-name
    ```

7. **Create a Pull Request**: Open a pull request from your fork's branch to the `main` branch of the original repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more detailed documentation and support, please visit the [Moviola Digest GitHub page](https://github.com/kevinagnes/moviola-digest).

Happy editing! 🎥
