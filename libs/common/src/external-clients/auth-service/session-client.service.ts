import { ProtoServices } from "@app/common/types/protoservice.types";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ClientGrpc } from "@nestjs/microservices";
import { SessionServiceClient } from "proto-gen/auth/v1/session_pb";

@Injectable()
export class SessionServiceClientBridge implements OnModuleInit {
    private extSessionService!: SessionServiceClient;

    constructor(@Inject('SESSION_PACKAGE') private sessionClient: ClientGrpc) {}

    onModuleInit() {
        this.extSessionService = this.sessionClient.getService<SessionServiceClient>(
            ProtoServices.SessionService,
        );
    }

}