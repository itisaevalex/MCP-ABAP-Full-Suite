# MCP ABAP ADT API MCP Server

## Description

The MCP ABAP ADT API MCP Server is a Model Context Protocol (MCP) server designed to facilitate seamless communication between ABAP systems and MCP clients. It provides a suite of tools and resources for managing ABAP objects, handling transport requests, performing code analysis, and more, enhancing the efficiency and effectiveness of ABAP development workflows.

## Features

- **Authentication**: Securely authenticate with ABAP systems using the `login` tool.
- **Object Management**: Create, read, update, and delete ABAP objects seamlessly.
- **Transport Handling**: Manage transport requests with tools like `createTransport` and `transportInfo`.
- **Code Analysis**: Perform syntax checks and retrieve code completion suggestions.
- **Extensibility**: Easily extend the server with additional tools and resources as needed.
- **Session Management**: Handle session caching and termination using `dropSession` and `logout`.

## Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [here](https://nodejs.org/).
- **ABAP System Access**: Credentials and URL to access the ABAP system.

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/mcp-abap-abap-adt-api.git
   cd mcp-abap-abap-adt-api
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory and add the necessary environment variables:

   ```env
   ABAP_SYSTEM_URL=https://your-abap-system-url
   ABAP_USERNAME=your_username
   ABAP_PASSWORD=your_password
   ```

4. **Build the Project**

   ```bash
   npm run build
   ```

5. **Run the Server**

   ```bash
   node build/index.js
   ```

## Usage

Once the server is running, you can interact with it using MCP clients or tools that support the Model Context Protocol.

### Examples

- **Authenticate with ABAP System**

  Use the `login` tool to authenticate:

  ```bash
  # Example command
  ```

- **Create a Transport Request**

  Use the `createTransport` tool with the necessary parameters:

  ```bash
  # Example command
  ```

- **Perform a Syntax Check**

  Use the `syntaxCheck` tool to validate ABAP code:

  ```bash
  # Example command
  ```

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. **Fork the Repository**
2. **Create a New Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add some feature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any inquiries or support, please contact [your.email@example.com](mailto:your.email@example.com).
