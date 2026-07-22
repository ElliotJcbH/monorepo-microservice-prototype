import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

// Acts as a client that communicates with the external Auth Service
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'SESSION_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'auth',
                    protoPath: join(process.cwd(), 'proto/auth/session_pb.proto'),
                    url: 'localhost:5001',
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class AuthClientModule {}
