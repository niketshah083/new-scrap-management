import { ApiProperty } from "@nestjs/swagger";

export class InspectionReportDto {
  @ApiProperty({ description: "Report number" })
  reportNumber: string;

  @ApiProperty({ description: "Generated at" })
  generatedAt: Date;

  @ApiProperty({ description: "GRN details" })
  grn: {
    grnNumber: string;
    truckNumber: string;
    driverName: string;
    grossWeight: number | null;
    tareWeight: number | null;
    netWeight: number | null;
    createdAt: Date;
  };

  @ApiProperty({ description: "Vendor details" })
  vendor: {
    name: string;
    code: string;
    contactPerson: string;
    phone: string;
  };

  @ApiProperty({ description: "Material details" })
  material: {
    name: string;
    code: string;
    unit: string;
  } | null;

  @ApiProperty({ description: "QC inspection details" })
  inspection: {
    inspectionNumber: string;
    status: string;
    inspectedAt: Date;
    testParameters: any[];
    moistureContent: number;
    impurityPercentage: number;
    qualityGrade: number;
    remarks: string;
    failureReason: string;
  };

  @ApiProperty({ description: "Gate pass details" })
  gatePass: {
    passNumber: string;
    issuedAt: Date;
    expiresAt: Date;
    status: string;
  } | null;
}
