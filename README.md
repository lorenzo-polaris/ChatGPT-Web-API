# ChatGPT-Web-API

This project provides a simple implementation of a ChatGPT API backed by your web browser using Node.js, Express, and Playwright. It allows you to interact with the ChatGPT model in real-time through an intuitive API.

If you have a Plus subscription, you can use this web server to interact with GPT-4 without the need for an API key, following the current request limitations.

## Prerequisites

Before running the project, make sure you have the following prerequisites installed on your machine:

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone the repository to your local machine:

   ```
   git clone https://github.com/lorenzo-polaris/ChatGPT-Web-API
   ```

2. Navigate to the project directory:

   ```
   cd ChatGPT-Web-API
   ```

3. Install the dependencies:

   ```
   npm install
   ```

## Usage

1. Start the browser and open the chat.openai.com page by running the following command:

   ```
   npm start
   ```

   This will launch a browser instance and navigate to the chat.openai.com page. You will need to login with your account.

2. To interact with the ChatGPT model, you can send HTTP POST requests to the `/run` endpoint with the desired prompt in the request body. For example:

   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"prompt": "Hello, ChatGPT!"}' http://localhost:3000/run
   ```

   The server will process the request, send the prompt to the ChatGPT model in the browser, and return the generated response as the API response.

   **Note:** If the browser is not started or the session is lost, the server will automatically start the browser when receiving a request to the `/run` endpoint.

3. Customize the code and endpoints as needed to suit your specific use case. You can modify the code in the `index.js` file to extend the functionality or change the behavior of the API.

4. To stop the server, press `Ctrl + C` in the terminal where the server is running.

## Known limitations and Next Steps

### Delay before parsing response
The current implementation of the script includes a fixed delay of 4 seconds before parsing the response from ChatGPT. This delay is added to ensure that ChatGPT has finished generating the response. While this provides a reasonable timeframe, it may not be optimal in all scenarios. Consider adjusting the delay based on your specific use case or requirements.

### Error Handling
The current code does not include comprehensive error handling mechanisms. It's important to implement appropriate error handling to gracefully handle any potential errors or exceptions that may occur during the interaction with ChatGPT. Enhancing the code with robust error handling will help improve the reliability and stability of the API.

## Contributing

Contributions to the BrowserChatGPT-API project are welcome. If you encounter any issues, have suggestions, or want to contribute improvements, please feel free to open an issue or submit a pull request on the project's GitHub repository.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use and modify the code for your own purposes.
