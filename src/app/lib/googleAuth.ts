import { OAuth2Client } from "google-auth-library";
import config from "../config";

const googleClient = new OAuth2Client(
	config.google_client_id,
	config.google_client_secret,
	config.google_callback_url,
);

export { googleClient };
