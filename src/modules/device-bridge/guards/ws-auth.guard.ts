import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { JwtPayload } from "../../auth/auth.service";

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = this.extractTokenFromClient(client);

    if (!token) {
      throw new WsException("Authentication token not provided");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.user = payload;
      return true;
    } catch {
      throw new WsException("Invalid or expired token");
    }
  }

  private extractTokenFromClient(client: Socket): string | undefined {
    // Try to get token from handshake auth
    const authToken = client.handshake?.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Try to get token from handshake headers
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Try to get token from query params
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === "string") {
      return queryToken;
    }

    return undefined;
  }
}

/**
 * Helper function to validate and extract user from socket
 */
export async function validateSocketToken(
  client: Socket,
  jwtService: JwtService
): Promise<JwtPayload | null> {
  const authToken =
    client.handshake?.auth?.token ||
    client.handshake?.headers?.authorization?.replace("Bearer ", "") ||
    client.handshake?.query?.token;

  if (!authToken || typeof authToken !== "string") {
    return null;
  }

  try {
    const payload = await jwtService.verifyAsync<JwtPayload>(authToken);
    return payload;
  } catch {
    return null;
  }
}
