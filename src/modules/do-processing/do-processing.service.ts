import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  DoProcessing,
  DoProcessingStatus,
  DoProcessingStep,
} from "../../entities/do-processing.entity";
import {
  DoProcessingItem,
  DoItemLoadingStatus,
} from "../../entities/do-processing-item.entity";
import { RFIDCard, RFIDCardStatus } from "../../entities/rfid-card.entity";
import {
  StartDoProcessingDto,
  GateEntryDto,
  InitialWeighingDto,
  ItemTareWeightDto,
  ItemGrossWeightDto,
  FinalWeighingDto,
  RecordItemWeightDto,
} from "./dto";
import { TransporterService } from "../transporter/transporter.service";

@Injectable()
export class DoProcessingService {
  constructor(
    @InjectRepository(DoProcessing)
    private doProcessingRepository: Repository<DoProcessing>,
    @InjectRepository(DoProcessingItem)
    private doProcessingItemRepository: Repository<DoProcessingItem>,
    @InjectRepository(RFIDCard)
    private rfidCardRepository: Repository<RFIDCard>,
    private transporterService: TransporterService
  ) {}

  /**
   * Start processing a delivery order
   */
  async startProcessing(
    tenantId: number,
    dto: StartDoProcessingDto,
    userId: number
  ): Promise<DoProcessing> {
    // Check if this DO is already being processed
    const existing = await this.doProcessingRepository.findOne({
      where: {
        tenantId,
        doNumber: dto.doNumber,
        status: DoProcessingStatus.InProgress,
      },
    });

    if (existing) {
      throw new ConflictException(
        `DO ${dto.doNumber} is already being processed`
      );
    }

    // Create DO processing record
    const doProcessing = this.doProcessingRepository.create({
      tenantId,
      externalDoId: dto.externalDoId,
      doNumber: dto.doNumber,
      doDate: dto.doDate ? new Date(dto.doDate) : null,
      vendorId: dto.vendorId,
      vendorName: dto.vendorName,
      vehicleNo: dto.vehicleNo,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      status: DoProcessingStatus.InProgress,
      currentStep: DoProcessingStep.GateEntry,
      remarks: dto.remarks,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedProcessing =
      await this.doProcessingRepository.save(doProcessing);

    // Create processing items from DO items
    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((item) =>
        this.doProcessingItemRepository.create({
          doProcessingId: savedProcessing.id,
          externalItemId: item.externalItemId,
          materialId: item.materialId,
          materialName: item.materialName,
          materialCode: item.materialCode,
          orderedQuantity: item.orderedQuantity,
          orderedRate: item.orderedRate,
          loadingStatus: DoItemLoadingStatus.Pending,
          createdBy: userId,
          updatedBy: userId,
        })
      );

      await this.doProcessingItemRepository.save(items);
    }

    return this.findOne(tenantId, savedProcessing.id);
  }

  /**
   * Step 1: Gate Entry - Truck arrives, RFID issued
   */
  async recordGateEntry(
    tenantId: number,
    id: number,
    dto: GateEntryDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.GateEntry) {
      throw new BadRequestException("Gate entry already completed");
    }

    // Get transporter details if transporterId is provided
    let transporterName: string | undefined;
    let transporterGstin: string | undefined;
    if (
      dto.transporterId !== undefined &&
      dto.transporterId !== null &&
      dto.transporterId !== ""
    ) {
      try {
        const transporter = await this.transporterService.findOne(
          tenantId,
          dto.transporterId
        );
        transporterName = transporter.transporterName;
        transporterGstin = transporter.gstin || undefined;
      } catch {
        // Transporter not found, ignore
      }
    }

    // Update gate entry details
    processing.vehicleNo = dto.vehicleNo;
    processing.driverName = dto.driverName;
    processing.driverPhone = dto.driverPhone;
    processing.driverLicense = dto.driverLicense;
    processing.transporterId =
      dto.transporterId !== undefined && dto.transporterId !== null
        ? String(dto.transporterId)
        : undefined;
    processing.transporterName = transporterName;
    processing.transporterGstin = transporterGstin;
    processing.gateEntryTime = new Date();
    processing.currentStep = DoProcessingStep.InitialWeighing;
    if (dto.remarks) processing.remarks = dto.remarks;
    processing.updatedBy = userId;

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Step 2: Initial Weighing - Weighbridge-1 tare weight with photos
   */
  async recordInitialWeighing(
    tenantId: number,
    id: number,
    dto: InitialWeighingDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.InitialWeighing) {
      throw new BadRequestException(
        "Initial weighing already completed or not ready"
      );
    }

    // Update initial weighing details
    processing.initialTareWeight = dto.initialTareWeight;
    processing.initialWeighingTime = new Date();
    processing.initialWeighbridgeId = dto.weighbridgeId;
    processing.driverPhotoPath = dto.driverPhotoPath;
    processing.licensePhotoPath = dto.licensePhotoPath;
    processing.truckPhotoPath = dto.truckPhotoPath;
    processing.currentStep = DoProcessingStep.ItemLoading;
    processing.updatedBy = userId;

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Step 4: Record item tare weight at weighbridge-2 before loading
   */
  async recordItemTareWeight(
    tenantId: number,
    id: number,
    dto: ItemTareWeightDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.ItemLoading) {
      throw new BadRequestException("Not in item loading phase");
    }

    // Find the item
    const item = processing.items.find((i) => i.id === dto.itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${dto.itemId} not found`);
    }

    if (item.loadingStatus !== DoItemLoadingStatus.Pending) {
      throw new BadRequestException("Item is not in pending status");
    }

    // Update item tare weight
    item.tareWeightWb2 = dto.tareWeightWb2;
    item.tareTimeWb2 = new Date();
    item.weighbridgeId = dto.weighbridgeId;
    item.loadingStatus = DoItemLoadingStatus.AtWeighbridge;
    item.loadingStartTime = new Date();
    item.updatedBy = userId;

    await this.doProcessingItemRepository.save(item);
    return this.findOne(tenantId, id);
  }

  /**
   * Step 5/6: Record item gross weight at weighbridge-2 after loading
   */
  async recordItemGrossWeight(
    tenantId: number,
    id: number,
    dto: ItemGrossWeightDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.ItemLoading) {
      throw new BadRequestException("Not in item loading phase");
    }

    // Find the item
    const item = processing.items.find((i) => i.id === dto.itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${dto.itemId} not found`);
    }

    if (
      item.loadingStatus !== DoItemLoadingStatus.AtWeighbridge &&
      item.loadingStatus !== DoItemLoadingStatus.Loading
    ) {
      throw new BadRequestException(
        "Item must have tare weight recorded first"
      );
    }

    if (!item.tareWeightWb2) {
      throw new BadRequestException("Item tare weight must be recorded first");
    }

    // Calculate loaded weight
    const loadedWeight = dto.grossWeightWb2 - item.tareWeightWb2;

    // Update item gross weight
    item.grossWeightWb2 = dto.grossWeightWb2;
    item.grossTimeWb2 = new Date();
    item.loadedWeight = loadedWeight;
    item.loadingStatus = DoItemLoadingStatus.Loaded;
    item.loadingCompleteTime = new Date();
    item.itemRemarks = dto.itemRemarks;
    item.updatedBy = userId;

    // Set loading sequence
    const loadedItems = processing.items.filter(
      (i) => i.loadingStatus === DoItemLoadingStatus.Loaded && i.id !== item.id
    );
    item.loadingSequence = loadedItems.length + 1;

    await this.doProcessingItemRepository.save(item);

    // Update total loaded weight
    const totalLoadedWeight =
      processing.items
        .filter((i) => i.loadingStatus === DoItemLoadingStatus.Loaded)
        .reduce((sum, i) => sum + (i.loadedWeight || 0), 0) + loadedWeight;

    processing.totalLoadedWeight = totalLoadedWeight;
    processing.updatedBy = userId;

    // Check if all items are loaded or skipped
    const pendingItems = processing.items.filter(
      (i) =>
        i.loadingStatus === DoItemLoadingStatus.Pending ||
        i.loadingStatus === DoItemLoadingStatus.AtWeighbridge ||
        i.loadingStatus === DoItemLoadingStatus.Loading
    );

    if (pendingItems.length === 0) {
      // All items processed, move to final weighing
      processing.currentStep = DoProcessingStep.FinalWeighing;
    }

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Mark item as loaded (ready for weighing)
   */
  async markItemAsLoaded(
    tenantId: number,
    id: number,
    itemId: number,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.ItemLoading) {
      throw new BadRequestException("Not in item loading phase");
    }

    const item = processing.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    if (item.loadingStatus !== DoItemLoadingStatus.Pending) {
      throw new BadRequestException("Item is not in pending status");
    }

    // Mark item as loading (ready for weighing)
    item.loadingStatus = DoItemLoadingStatus.Loading;
    item.loadingStartTime = new Date();
    item.updatedBy = userId;

    await this.doProcessingItemRepository.save(item);
    return this.findOne(tenantId, id);
  }

  /**
   * Record item weight with weight after loading
   */
  async recordItemWeight(
    tenantId: number,
    id: number,
    dto: RecordItemWeightDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.ItemLoading) {
      throw new BadRequestException("Not in item loading phase");
    }

    const item = processing.items.find((i) => i.id === dto.itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${dto.itemId} not found`);
    }

    if (item.loadingStatus !== DoItemLoadingStatus.Loading) {
      throw new BadRequestException("Item must be marked as loaded first");
    }

    // Calculate tare weight (current truck weight before loading this item)
    const tareWeight = this.calculateCurrentTruckWeight(processing);
    const grossWeight = Number(dto.weightAfterLoading);
    const loadedWeight = grossWeight - tareWeight;

    if (loadedWeight <= 0) {
      throw new BadRequestException(
        `Loaded weight must be positive. Gross: ${grossWeight}, Tare: ${tareWeight}, Calculated: ${loadedWeight}`
      );
    }

    // Update item with weights
    item.tareWeightWb2 = tareWeight;
    item.grossWeightWb2 = grossWeight;
    item.loadedWeight = loadedWeight;
    item.weighbridgeId = dto.weighbridgeId || 2;
    item.loadingStatus = DoItemLoadingStatus.Loaded;
    item.loadingCompleteTime = new Date();
    item.itemRemarks = dto.itemRemarks;
    item.updatedBy = userId;

    // Set loading sequence
    const loadedItems = processing.items.filter(
      (i) => i.loadingStatus === DoItemLoadingStatus.Loaded && i.id !== item.id
    );
    item.loadingSequence = loadedItems.length + 1;

    await this.doProcessingItemRepository.save(item);

    // Update total loaded weight
    const totalLoadedWeight =
      processing.items
        .filter((i) => i.loadingStatus === DoItemLoadingStatus.Loaded)
        .reduce((sum, i) => sum + (Number(i.loadedWeight) || 0), 0) +
      loadedWeight;

    processing.totalLoadedWeight = totalLoadedWeight;
    processing.updatedBy = userId;

    // Check if all items are loaded
    const pendingItems = processing.items.filter(
      (i) =>
        i.loadingStatus === DoItemLoadingStatus.Pending ||
        i.loadingStatus === DoItemLoadingStatus.Loading
    );

    if (pendingItems.length === 0) {
      // All items processed, move to final weighing
      processing.currentStep = DoProcessingStep.FinalWeighing;
    }

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Calculate current truck weight (initial tare + loaded items)
   */
  private calculateCurrentTruckWeight(processing: DoProcessing): number {
    const initialTareWeight = Number(processing.initialTareWeight) || 0;
    const loadedItemsWeight = processing.items
      .filter((i) => i.loadingStatus === DoItemLoadingStatus.Loaded)
      .reduce((sum, item) => sum + (Number(item.loadedWeight) || 0), 0);

    return initialTareWeight + loadedItemsWeight;
  }

  /**
   * Skip an item (won't be loaded)
   */
  async skipItem(
    tenantId: number,
    id: number,
    itemId: number,
    remarks: string,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.ItemLoading) {
      throw new BadRequestException("Not in item loading phase");
    }

    const item = processing.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    if (item.loadingStatus === DoItemLoadingStatus.Loaded) {
      throw new BadRequestException("Cannot skip an already loaded item");
    }

    item.loadingStatus = DoItemLoadingStatus.Skipped;
    item.itemRemarks = remarks;
    item.updatedBy = userId;

    await this.doProcessingItemRepository.save(item);

    // Check if all items are loaded or skipped
    const pendingItems = processing.items.filter(
      (i) =>
        i.loadingStatus === DoItemLoadingStatus.Pending ||
        i.loadingStatus === DoItemLoadingStatus.AtWeighbridge ||
        i.loadingStatus === DoItemLoadingStatus.Loading
    );

    if (pendingItems.length === 0) {
      // All items processed, move to final weighing
      processing.currentStep = DoProcessingStep.FinalWeighing;
      processing.updatedBy = userId;
      await this.doProcessingRepository.save(processing);
    }

    return this.findOne(tenantId, id);
  }

  /**
   * Step 8: Final Weighing - Weighbridge-1 gross weight
   */
  async recordFinalWeighing(
    tenantId: number,
    id: number,
    dto: FinalWeighingDto,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status !== DoProcessingStatus.InProgress) {
      throw new BadRequestException("Processing is not in progress");
    }

    if (processing.currentStep !== DoProcessingStep.FinalWeighing) {
      throw new BadRequestException("Not ready for final weighing");
    }

    // Check if at least one item is loaded
    const loadedItems = processing.items.filter(
      (i) => i.loadingStatus === DoItemLoadingStatus.Loaded
    );

    if (loadedItems.length === 0) {
      throw new BadRequestException("At least one item must be loaded");
    }

    // Calculate net weight
    const netWeight = processing.initialTareWeight
      ? dto.finalGrossWeight - processing.initialTareWeight
      : null;

    // Update final weighing details
    processing.finalGrossWeight = dto.finalGrossWeight;
    processing.finalWeighingTime = new Date();
    processing.finalWeighbridgeId = dto.weighbridgeId;
    processing.netWeight = netWeight;
    processing.currentStep = DoProcessingStep.Completed;
    processing.status = DoProcessingStatus.Completed;
    processing.completedTime = new Date();
    if (dto.remarks) processing.remarks = dto.remarks;
    processing.updatedBy = userId;

    // Release RFID card if assigned
    if (processing.rfidCardId) {
      const rfidCard = await this.rfidCardRepository.findOne({
        where: { id: processing.rfidCardId },
      });
      if (rfidCard) {
        rfidCard.doProcessingId = null;
        rfidCard.assignmentType = null;
        rfidCard.status = RFIDCardStatus.AVAILABLE;
        rfidCard.assignedAt = null;
        rfidCard.updatedBy = userId;
        await this.rfidCardRepository.save(rfidCard);
      }
      processing.rfidCardId = null;
    }

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Cancel processing
   */
  async cancelProcessing(
    tenantId: number,
    id: number,
    remarks: string,
    userId: number
  ): Promise<DoProcessing> {
    const processing = await this.findOne(tenantId, id);

    if (processing.status === DoProcessingStatus.Completed) {
      throw new BadRequestException("Cannot cancel completed processing");
    }

    processing.status = DoProcessingStatus.Cancelled;
    processing.remarks = remarks;
    processing.updatedBy = userId;

    await this.doProcessingRepository.save(processing);
    return this.findOne(tenantId, id);
  }

  /**
   * Find all DO processing records for a tenant
   */
  async findAll(
    tenantId: number,
    status?: DoProcessingStatus
  ): Promise<DoProcessing[]> {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    return this.doProcessingRepository.find({
      where,
      relations: ["items"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Find in-progress processing records
   */
  async findInProgress(tenantId: number): Promise<DoProcessing[]> {
    return this.findAll(tenantId, DoProcessingStatus.InProgress);
  }

  /**
   * Find one DO processing record
   */
  async findOne(tenantId: number, id: number): Promise<DoProcessing> {
    const processing = await this.doProcessingRepository.findOne({
      where: { id, tenantId },
      relations: ["items"],
    });

    if (!processing) {
      throw new NotFoundException(`DO Processing with ID ${id} not found`);
    }

    // Sort items by loading sequence
    if (processing.items) {
      processing.items.sort(
        (a, b) => (a.loadingSequence || 0) - (b.loadingSequence || 0)
      );
    }

    return processing;
  }

  /**
   * Find processing by DO number
   */
  async findByDoNumber(
    tenantId: number,
    doNumber: string
  ): Promise<DoProcessing | null> {
    return this.doProcessingRepository.findOne({
      where: { tenantId, doNumber },
      relations: ["items"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get processing summary/stats
   */
  async getStats(tenantId: number): Promise<{
    total: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    const [total, inProgress, completed, cancelled] = await Promise.all([
      this.doProcessingRepository.count({ where: { tenantId } }),
      this.doProcessingRepository.count({
        where: { tenantId, status: DoProcessingStatus.InProgress },
      }),
      this.doProcessingRepository.count({
        where: { tenantId, status: DoProcessingStatus.Completed },
      }),
      this.doProcessingRepository.count({
        where: { tenantId, status: DoProcessingStatus.Cancelled },
      }),
    ]);

    return { total, inProgress, completed, cancelled };
  }
}
