# Flaggy

![Logo of Flaggy.](https://raw.githubusercontent.com/jnylen/flaggy/refs/heads/main/logo.png)

A Firefox extension that shows the country flag of the current website's hosting location in the toolbar.

## Features

- Displays the host country's flag in the browser toolbar
- Hover over the icon to see the country name and IP address
- Click the icon to view detailed geo information (country, city, ISP, ASN, timezone)
- Supports 400+ country flags

## Installation

### From GitHub Releases

1. Download the latest `.xpi` file from the [Releases page](https://github.com/jnylen/flaggy/releases)
2. Open Firefox and go to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the downloaded `.xpi` file

### From Source

1. Clone the repository
2. Run `./flaggy/build.sh` to build the XPI
3. Install the generated XPI as above

## Building

```bash
cd flaggy
./build.sh
```

This creates `flaggy-v{version}.xpi`.

## API

Uses [ip.sb](https://ip.sb/api/) for IP geolocation data and [circle-flags](https://github.com/HatScripts/circle-flags) for flag icons.


## License

MIT License - see [LICENSE](LICENSE)
