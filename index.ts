import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import he from 'he';
import dotenv from "dotenv";
dotenv.config();
const abi = require('./hosting_abi.json');
const contractAddress = process.env.CONTRACT_ADDRESS as `0x${string}`
const rpcUrl = process.env.RPC_URL

const app = express();
const PORT = 80;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(contractAddress, abi, provider);

// Function to fetch HTML from the contract
const fetchHtmlFromContract = async (domain: string): Promise<string> => {
    try {
        const html = await contract.getPage(domain);
        return he.decode(html);
    } catch (error) {
        console.error(error);
        return 'Error fetching HTML from the contract.';
    }
};

// Serve the main page
app.get('/', (req: Request, res: Response) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Valve AI - On-Chain Web Hosting</title>
    </head>
    <body style="display: flex; flex-direction: column; align-items: center; height: 100vh; margin: 0; text-align: center;">
        <h1>Enter Domain Name (ending with .vpu)</h1>
        <form action="/visit" method="post">
            <input type="text" name="domain" placeholder="Enter domain name" required>
            <button type="submit">Visit</button>
        </form>
        <div id="content"></div>
    </body>
    </html>
  `);
});

// Handle the form submission
app.post('/visit', async (req: Request, res: Response) => {
    const domain = req.body.domain;
    const htmlContent = await fetchHtmlFromContract(domain.toString());

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>On-Chain Web Hosting</title>
    </head>
    <body style="display: flex; flex-direction: column; align-items: center; height: 100vh; margin: 0; text-align: center;">
        <h1>Displaying content for: ${domain}</h1>
        <a style="margin-bottom: 30px;" href="/">Go back</a>
        <div id="content">
        ${
        !htmlContent ? 'This page is empty' :
            htmlContent
        }
        </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
