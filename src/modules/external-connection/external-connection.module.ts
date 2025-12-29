import { Global, Module } from "@nestjs/common";
import { ExternalConnectionService } from "./external-connection.service";
import { EncryptionService } from "../../common/services/encryption.service";

/**
 * External Connection Module
 * Provides global access to external database connection management.
 * Registered as a global module for easy dependency injection across the application.
 */
@Global()
@Module({
  providers: [ExternalConnectionService, EncryptionService],
  exports: [ExternalConnectionService, EncryptionService],
})
export class ExternalConnectionModule {}
