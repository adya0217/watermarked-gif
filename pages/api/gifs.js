import axios from 'axios';

export default async function handler(req, res) {
    const { query } = req.query;
    try {
        const response = await axios.get(
            `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${query}&limit=20&rating=g`
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error('GIPHY API Error:', error);
        res.status(500).json({ error: 'Failed to fetch GIFs' });
    }
}