import SpotifyWebApi from 'spotify-web-api-node';

export default function handler(req, res) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    res.redirect('/api/auth/callback/spotify?code=mock_code');
    return;
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
  ];

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);

  res.redirect(authorizeURL);
}
