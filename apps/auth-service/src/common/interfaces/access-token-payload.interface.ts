import { IUser } from '@app/common/interfaces/user.interface';
import { JwtPayload } from 'jsonwebtoken';

interface IAccessTokenPayload extends JwtPayload {
    user: IUser;
}

export default IAccessTokenPayload;
