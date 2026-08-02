import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserServiceClientBridge } from './user-client.service';

// Acts as a client that communicates with the external User Service
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'USER_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'user',
                    protoPath: join(
                        process.cwd(),
                        'proto/user/v1/user_pb.proto',
                    ),
                    url: 'localhost:5002',
                },
            },
        ]),
    ],
    providers: [UserServiceClientBridge],
    exports: [UserServiceClientBridge]
})
export class UserClientModule {}
