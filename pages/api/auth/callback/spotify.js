import SpotifyWebApi from 'spotify-web-api-node';

export default async function handler(req, res) {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });

    const code = req.query.code;

    try {
        if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
            res.status(200).json({
                accessToken: 'mock_access_token',
                refreshToken: 'mock_refresh_token',
                expiresIn: 3600,
            });
            return;
        }

        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        // For now, just return tokens
        res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to get tokens' });
    }
}
