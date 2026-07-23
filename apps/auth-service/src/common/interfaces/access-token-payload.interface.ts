import { JwtPayload } from 'jsonwebtoken';
import { SessionUserInfo } from 'proto-gen/auth/v1/session_pb';

interface IAccessTokenPayload extends JwtPayload {
    user: SessionUserInfo;
}

export default IAccessTokenPayload;
