import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  RFIDCard,
  RFIDCardStatus,
  RFIDCardAssignmentType,
} from "../../entities/rfid-card.entity";
import { GRN } from "../../entities/grn.entity";
import { DoProcessing } from "../../entities/do-processing.entity";
import {
  CreateRFIDCardDto,
  UpdateRFIDCardDto,
  AssignRFIDCardDto,
  ScanRFIDCardDto,
  AssignmentType,
} from "./dto";

@Injectable()
export class RFIDService {
  constructor(
    @InjectRepository(RFIDCard)
    private rfidCardRepository: Repository<RFIDCard>,
    @InjectRepository(GRN)
    private grnRepository: Repository<GRN>,
    @InjectRepository(DoProcessing)
    private doProcessingRepository: Repository<DoProcessing>
  ) {}

  async create(
    tenantId: number,
    createDto: CreateRFIDCardDto,
    userId: number
  ): Promise<RFIDCard> {
    // Check if card number already exists
    const existing = await this.rfidCardRepository.findOne({
      where: { cardNumber: createDto.cardNumber },
    });

    if (existing) {
      throw new ConflictException(
        `RFID card with number ${createDto.cardNumber} already exists`
      );
    }

    const card = this.rfidCardRepository.create({
      ...createDto,
      tenantId,
      status: RFIDCardStatus.AVAILABLE,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.rfidCardRepository.save(card);
  }

  async findAll(tenantId: number): Promise<RFIDCard[]> {
    return this.rfidCardRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  async findAvailable(tenantId: number): Promise<RFIDCard[]> {
    return this.rfidCardRepository.find({
      where: { tenantId, status: RFIDCardStatus.AVAILABLE },
      order: { label: "ASC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<RFIDCard> {
    const card = await this.rfidCardRepository.findOne({
      where: { id, tenantId },
    });

    if (!card) {
      throw new NotFoundException(`RFID card with ID ${id} not found`);
    }

    return card;
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateRFIDCardDto,
    userId: number
  ): Promise<RFIDCard> {
    const card = await this.findOne(tenantId, id);

    Object.assign(card, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.rfidCardRepository.save(card);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const card = await this.findOne(tenantId, id);

    if (card.status === RFIDCardStatus.ASSIGNED) {
      throw new BadRequestException(
        "Cannot delete an assigned card. Unassign it first."
      );
    }

    card.deletedBy = userId;
    await this.rfidCardRepository.save(card);
    await this.rfidCardRepository.softRemove(card);
  }

  /**
   * Assign an RFID card to a GRN or DO Processing
   */
  async assign(
    tenantId: number,
    assignDto: AssignRFIDCardDto,
    userId: number
  ): Promise<{ card: RFIDCard; grn?: GRN; doProcessing?: DoProcessing }> {
    // Find the card by card number
    const card = await this.rfidCardRepository.findOne({
      where: { cardNumber: assignDto.cardNumber, tenantId },
    });

    if (!card) {
      throw new NotFoundException(
        `RFID card with number ${assignDto.cardNumber} not found`
      );
    }

    if (card.status !== RFIDCardStatus.AVAILABLE) {
      throw new BadRequestException(
        `Card is not available. Current status: ${card.status}`
      );
    }

    // Determine assignment type
    if (assignDto.grnId) {
      // Assign to GRN
      const grn = await this.grnRepository.findOne({
        where: { id: assignDto.grnId, tenantId },
      });

      if (!grn) {
        throw new NotFoundException(`GRN with ID ${assignDto.grnId} not found`);
      }

      if (grn.rfidCardId) {
        throw new BadRequestException("GRN already has an RFID card assigned");
      }

      // Assign the card to GRN
      card.grnId = grn.id;
      card.doProcessingId = null;
      card.assignmentType = RFIDCardAssignmentType.GRN;
      card.status = RFIDCardStatus.ASSIGNED;
      card.assignedAt = new Date();
      card.updatedBy = userId;

      grn.rfidCardId = card.id;

      await this.rfidCardRepository.save(card);
      await this.grnRepository.save(grn);

      return { card, grn };
    } else if (assignDto.doProcessingId) {
      // Assign to DO Processing
      const doProcessing = await this.doProcessingRepository.findOne({
        where: { id: assignDto.doProcessingId, tenantId },
      });

      if (!doProcessing) {
        throw new NotFoundException(
          `DO Processing with ID ${assignDto.doProcessingId} not found`
        );
      }

      if (doProcessing.rfidCardId) {
        throw new BadRequestException(
          "DO Processing already has an RFID card assigned"
        );
      }

      // Assign the card to DO Processing
      card.doProcessingId = doProcessing.id;
      card.grnId = null;
      card.assignmentType = RFIDCardAssignmentType.DO_PROCESSING;
      card.status = RFIDCardStatus.ASSIGNED;
      card.assignedAt = new Date();
      card.updatedBy = userId;

      doProcessing.rfidCardId = card.id;
      doProcessing.rfidTag = card.cardNumber;
      doProcessing.rfidIssuedTime = new Date();

      await this.rfidCardRepository.save(card);
      await this.doProcessingRepository.save(doProcessing);

      return { card, doProcessing };
    } else {
      throw new BadRequestException(
        "Either grnId or doProcessingId must be provided"
      );
    }
  }

  /**
   * Unassign an RFID card from its GRN or DO Processing
   */
  async unassign(
    tenantId: number,
    cardNumber: string,
    userId: number
  ): Promise<RFIDCard> {
    const card = await this.rfidCardRepository.findOne({
      where: { cardNumber, tenantId },
    });

    if (!card) {
      throw new NotFoundException(
        `RFID card with number ${cardNumber} not found`
      );
    }

    if (card.status !== RFIDCardStatus.ASSIGNED) {
      throw new BadRequestException("Card is not currently assigned");
    }

    // Unassign from GRN if assigned
    if (card.grnId) {
      const grn = await this.grnRepository.findOne({
        where: { id: card.grnId, tenantId },
      });

      if (grn) {
        grn.rfidCardId = null;
        await this.grnRepository.save(grn);
      }
    }

    // Unassign from DO Processing if assigned
    if (card.doProcessingId) {
      const doProcessing = await this.doProcessingRepository.findOne({
        where: { id: card.doProcessingId, tenantId },
      });

      if (doProcessing) {
        doProcessing.rfidCardId = null;
        await this.doProcessingRepository.save(doProcessing);
      }
    }

    // Reset card
    card.grnId = null;
    card.doProcessingId = null;
    card.assignmentType = null;
    card.status = RFIDCardStatus.AVAILABLE;
    card.assignedAt = null;
    card.updatedBy = userId;

    return this.rfidCardRepository.save(card);
  }

  /**
   * Scan an RFID card - returns the linked GRN or DO Processing if assigned
   */
  async scan(
    tenantId: number,
    scanDto: ScanRFIDCardDto,
    userId: number
  ): Promise<{
    card: RFIDCard;
    grn: GRN | null;
    doProcessing: DoProcessing | null;
  }> {
    const card = await this.rfidCardRepository.findOne({
      where: { cardNumber: scanDto.cardNumber, tenantId },
    });

    if (!card) {
      throw new NotFoundException(
        `RFID card with number ${scanDto.cardNumber} not found`
      );
    }

    // Update last scanned info
    card.lastScannedAt = new Date();
    card.lastScannedBy = userId;
    await this.rfidCardRepository.save(card);

    // Get linked GRN if assigned
    let grn: GRN | null = null;
    if (card.grnId) {
      grn = await this.grnRepository.findOne({
        where: { id: card.grnId, tenantId },
        relations: ["purchaseOrder", "vendor", "rfidCard"],
      });
    }

    // Get linked DO Processing if assigned
    let doProcessing: DoProcessing | null = null;
    if (card.doProcessingId) {
      doProcessing = await this.doProcessingRepository.findOne({
        where: { id: card.doProcessingId, tenantId },
        relations: ["items"],
      });
    }

    return { card, grn, doProcessing };
  }

  /**
   * Find card by card number
   */
  async findByCardNumber(
    tenantId: number,
    cardNumber: string
  ): Promise<RFIDCard | null> {
    return this.rfidCardRepository.findOne({
      where: { cardNumber, tenantId },
    });
  }
}
