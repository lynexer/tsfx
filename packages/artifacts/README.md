# @tsfx/artifacts

Downloads and extracts FiveM server artifacts, supporting both the legacy FXServer build and
the FiveM for GTAV Enhanced build.

## Usage

```bash
npx @tsfx/artifacts [options]
```

### Options

| Option                | Alias | Description                                      | Default       |
| --------------------- | ----- | ------------------------------------------------ | ------------- |
| `--output <dir>`      | `-o`  | Output directory                                 | `fxserver`    |
| `--platform <name>`   | `-p`  | `legacy` or `enhanced`                           | `legacy`      |
| `--branch <name>`     | `-b`  | `recommended` or `latest` (legacy platform only) | `recommended` |
| `--help`              | `-h`  | Show help                                        | —             |

The operating system (`win32` / `linux`) is detected automatically.

### Examples

```bash
# Recommended legacy build
npx @tsfx/artifacts

# Latest legacy build, extracted to ./server
npx @tsfx/artifacts --branch latest --output server

# FiveM for GTAV Enhanced build
npx @tsfx/artifacts --platform enhanced
```
