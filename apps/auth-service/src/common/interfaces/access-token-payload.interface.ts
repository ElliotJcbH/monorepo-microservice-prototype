import { JwtPayload } from 'jsonwebtoken';

interface IAccessTokenPayload extends JwtPayload {
    user_id: string;
}

export default IAccessTokenPayload;
